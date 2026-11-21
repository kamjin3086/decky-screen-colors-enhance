"""Regression tests for the SDR LUT controls; run with python -m unittest discover -s tests."""
import math
import os
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

# The pure LUT functions do not need a running Steam Deck/Decky instance.
sys.modules.setdefault("decky", types.ModuleType("decky"))
import main as colors


class ReduceWhitePointTests(unittest.TestCase):
    def test_native_is_identity_including_legacy_profiles(self):
        for rgb in [(0, 0, 0), (0.2, 0.5, 0.9), (0.7, 0.7, 0.7), (1, 1, 1)]:
            self.assertEqual(colors._apply(*rgb, colors._coeffs(colors.NATIVE)), rgb)
        old = {"saturation": 90, "vibrance": -5, "temperature": 20, "contrast": -10}
        with_disabled = {**old, "white_reduction": 0, "white_threshold": 70}
        for rgb in [(0, 0, 0), (0.3, 0.4, 0.8), (1, 1, 1)]:
            self.assertEqual(
                colors._apply(*rgb, colors._coeffs(old)),
                colors._apply(*rgb, colors._coeffs(with_disabled)),
            )

    def test_white_reduction_and_shadows(self):
        cfg = {**colors.NATIVE, "white_reduction": 10, "white_threshold": 70}
        c = colors._coeffs(cfg)
        for rgb in [(0, 0, 0), (0.3, 0.3, 0.3), (0.7, 0.7, 0.7)]:
            result = colors._apply(*rgb, c)
            for actual, expected in zip(result, rgb):
                self.assertAlmostEqual(actual, expected)
        for actual in colors._apply(1, 1, 1, c):
            self.assertAlmostEqual(actual, 0.9)
        self.assertAlmostEqual(colors._apply(1, 0, 0, c)[0], 0.9)

    def test_color_ratios_preserved(self):
        rgb = (1.0, 0.5, 0.2)
        out = colors._apply(
            *rgb, colors._coeffs({**colors.NATIVE, "white_reduction": 20})
        )
        factors = [out[i] / rgb[i] for i in range(3)]
        self.assertAlmostEqual(factors[0], factors[1], places=12)
        self.assertAlmostEqual(factors[1], factors[2], places=12)

    def test_highlights_remain_monotone_for_all_supported_settings(self):
        for reduction in (1, 5, 10, 20, 30, 50):
            for threshold in (50, 70, 90):
                c = colors._coeffs({
                    **colors.NATIVE, "white_reduction": reduction,
                    "white_threshold": threshold,
                })
                for rgb_fn in (
                    lambda v: (v, v, v),
                    lambda v: (v, v * 0.5, v * 0.2),
                ):
                    last_peak = -1
                    for i in range(1001):
                        rgb = rgb_fn(i / 1000)
                        out = colors._apply(*rgb, c)
                        self.assertTrue(all(0 <= v <= 1 for v in out))
                        peak = max(out)
                        self.assertGreaterEqual(peak + 1e-12, last_peak)
                        last_peak = peak

    def test_reduction_and_threshold_clamped(self):
        state = colors.sanitize({"white_reduction": 900, "white_threshold": -1})
        self.assertEqual(state, {"white_reduction": 50, "white_threshold": 50})

    def test_legacy_settings_are_compatible(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"DECKY_PLUGIN_SETTINGS_DIR": tmp}):
                with open(os.path.join(tmp, "color.json"), "w") as f:
                    f.write('{"saturation":90,"vibrance":-5,"temperature":20,"contrast":-10}')
                state = colors._load_state()
                self.assertEqual(state["white_reduction"], 0)
                self.assertEqual(state["white_threshold"], 70)
                self.assertEqual(state["saturation"], 90)
                self.assertEqual(state["contrast"], -10)
                colors._save_state(state)
                self.assertEqual(state, colors._load_state())

    def test_cube_shape(self):
        cfg = {**colors.NATIVE, "white_reduction": 10}
        lines = colors.build_cube(cfg).splitlines()
        self.assertEqual(len(lines), 17 ** 3 + 2)
        self.assertEqual(lines[1], "LUT_3D_SIZE 17")


if __name__ == "__main__":
    unittest.main()
