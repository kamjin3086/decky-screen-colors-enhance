"""Personal preset CRUD and persistence tests without a Steam Deck."""
import asyncio
import json
import os
import tempfile
import types
import unittest
from unittest.mock import patch
import sys

sys.modules.setdefault("decky", types.ModuleType("decky"))
import main as colors


class FakeBackend:
    supported = True
    probe_detail = "test"
    def apply(self, state):
        return True


class UserPresetsTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {"DECKY_PLUGIN_SETTINGS_DIR": self.tmp.name})
        self.env.start()
        self.plugin = colors.Plugin()
        self.plugin._state = dict(colors.NATIVE)
        self.plugin._user_presets = []
        self.plugin._selected_user_preset = None
        self.plugin._backend = FakeBackend()

    async def asyncTearDown(self):
        self.env.stop()
        self.tmp.cleanup()

    async def test_new_presets_are_named_and_persisted_separately(self):
        await self.plugin.set_color({"saturation": 90, "white_reduction": 10})
        response = await self.plugin.save_user_preset("  我的 OLED  ")
        self.assertEqual(len(response["user_presets"]), 1)
        self.assertEqual(response["user_presets"][0]["name"], "我的 OLED")
        self.assertEqual(response["user_preset_dirty"], False)
        self.assertTrue(os.path.exists(colors._user_presets_path()))
        with open(colors._settings_path(), encoding="utf8") as f:
            color_state = json.load(f)
        self.assertEqual(color_state["saturation"], 90)
        self.assertNotIn("user_presets", color_state)
        items, selected = colors._load_user_presets()
        self.assertEqual(selected, response["selected_user_preset"])
        self.assertEqual(items[0]["color"]["white_reduction"], 10)

    async def test_restore_and_switch_profiles(self):
        await self.plugin.set_color({"saturation": 90})
        first = (await self.plugin.save_user_preset("Day"))["selected_user_preset"]
        await self.plugin.set_color({"saturation": 80})
        self.assertTrue(self.plugin._state_dict()["user_preset_dirty"])
        second = (await self.plugin.save_user_preset("Night"))["selected_user_preset"]
        self.assertNotEqual(first, second)
        self.assertEqual(len(self.plugin._user_presets), 2)
        loaded = await self.plugin.load_user_preset(first)
        self.assertEqual(loaded["color"]["saturation"], 90)
        self.assertFalse(loaded["user_preset_dirty"])
        loaded = await self.plugin.load_user_preset(second)
        self.assertEqual(loaded["color"]["saturation"], 80)
        self.assertFalse(loaded["user_preset_dirty"])

    async def test_overwrite_or_save_as_new(self):
        await self.plugin.set_color({"contrast": -10})
        first = (await self.plugin.save_user_preset("Comfort"))["selected_user_preset"]
        await self.plugin.set_color({"contrast": -20})
        with self.assertRaises(ValueError):
            await self.plugin.overwrite_user_preset("not-selected")
        saved = await self.plugin.overwrite_user_preset(first)
        self.assertEqual(len(saved["user_presets"]), 1)
        self.assertFalse(saved["user_preset_dirty"])
        await self.plugin.set_color({"contrast": -30})
        second = (await self.plugin.save_user_preset("Comfort Plus"))["selected_user_preset"]
        self.assertNotEqual(first, second)
        await self.plugin.load_user_preset(first)
        self.assertEqual(self.plugin._state["contrast"], -20)

    async def test_rename_delete_preserves_current_display(self):
        await self.plugin.set_color({"vibrance": -5})
        uid = (await self.plugin.save_user_preset("A"))["selected_user_preset"]
        await self.plugin.rename_user_preset(uid, "A Better Name")
        self.assertEqual(self.plugin._state_dict()["user_presets"][0]["name"], "A Better Name")
        await self.plugin.delete_user_preset(uid)
        self.assertEqual(self.plugin._state["vibrance"], -5)
        self.assertIsNone(self.plugin._selected_user_preset)
        self.assertEqual(self.plugin._user_presets, [])
        self.assertEqual(colors._load_user_presets(), ([], None))

    async def test_builtins_not_mutated_or_deleted(self):
        uid = (await self.plugin.save_user_preset("Mine"))["selected_user_preset"]
        await self.plugin.apply_preset("vivo")
        self.assertIsNone(self.plugin._selected_user_preset)
        self.assertEqual(self.plugin._state["saturation"], 145)
        self.assertEqual(len(self.plugin._user_presets), 1)
        self.assertIn("vivo", colors.PRESETS)
        await self.plugin.load_user_preset(uid)
        await self.plugin.apply_oled_look()
        self.assertIsNone(self.plugin._selected_user_preset)
        await self.plugin.reset()
        self.assertTrue(colors.is_native(self.plugin._state))
        self.assertEqual(len(self.plugin._user_presets), 1)

    async def test_invalid_names_are_rejected(self):
        await self.plugin.save_user_preset("Evening")
        for name in ("", "   ", "z" * 41, "Evening", "evening", None):
            with self.subTest(name=name):
                with self.assertRaises(ValueError):
                    await self.plugin.save_user_preset(name)
        await self.plugin.save_user_preset("Another")
        uid = self.plugin._selected_user_preset
        with self.assertRaises(ValueError):
            await self.plugin.rename_user_preset(uid, "eVeNiNg")
        self.assertEqual(len(self.plugin._user_presets), 2)

    async def test_missing_deletes_fail_without_touching_current_color(self):
        before = dict(self.plugin._state)
        with self.assertRaises(ValueError):
            await self.plugin.load_user_preset("unknown")
        with self.assertRaises(ValueError):
            await self.plugin.delete_user_preset("unknown")
        self.assertEqual(self.plugin._state, before)

    async def test_storage_limit(self):
        for i in range(colors.MAX_USER_PRESETS):
            await self.plugin.save_user_preset(f"Preset {i}")
        with self.assertRaises(ValueError):
            await self.plugin.save_user_preset("One too many")
        self.assertEqual(len(self.plugin._user_presets), colors.MAX_USER_PRESETS)

    async def test_corrupt_file_does_not_break_default_state(self):
        with open(colors._user_presets_path(), "w", encoding="utf8") as f:
            f.write("{not-json}")
        self.assertEqual(colors._load_user_presets(), ([], None))
        with open(colors._user_presets_path(), "w", encoding="utf8") as f:
            json.dump({"items": [{"id": "q", "name": "bad", "color": {}}],
                       "selected_id": "q"}, f)
        self.assertEqual(colors._load_user_presets(), ([], None))


if __name__ == "__main__":
    unittest.main()
