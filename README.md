> [!IMPORTANT]
> **This is a community fork of [Screen Colors by PacificSilent](https://github.com/PacificSilent/decky-screen-colors).** The original project, credits, and documentation are preserved below. This section describes why the fork exists and what it adds.

## Why this fork exists

**A beautiful OLED screen does not always feel comfortable to look at.**

This fork started with a Steam Deck LCD owner trying a Steam Deck OLED. The OLED looked more vivid and contrasty, but some colors and bright highlights felt unusually intense, with an urge to squint and a sense of tension around the eyes. The LCD, by comparison, felt softer and more relaxed.

Rather than assuming OLED itself was the problem, we tried adjusting the image. **Slightly lowering saturation, vibrance, and contrast made a surprisingly large subjective difference.** Some whites and highlights still felt too strong, which motivated a separate *Reduce White Point* control.

The aim is simple: **help people find a comfortable-looking OLED image without giving up the screen's benefits or forcing a yellow/warm color temperature.** Everyone perceives screens differently; this is an additional option, not a claim that one display setting is universally better.

## What's different in this fork?

- **Reduce White Point / Bright color reduction (0–50)**: compresses very bright white and colored pixel values while aiming to leave shadows unchanged. Default **0 (off)**.
- **Highlight start (50–90)**: adjusts where the highlight compression begins; default **70**. The algorithm automatically keeps its brightness mapping monotonic.
- **Works alongside the original controls**: keep your saturation, vibrance, contrast, and temperature preferences rather than installing a separate color-grading plugin.
- **Backwards-compatible settings**: existing saved profiles continue to work with white reduction disabled until you enable it.
- **Tests and CI**: regression tests check old profiles, dark-region preservation, color ratios, and monotonic highlight mapping; GitHub Actions builds a Decky install ZIP.

### Who might find this useful?

- **Steam Deck LCD → OLED upgraders** who enjoy the OLED image but miss the LCD's softer look.
- Players who find **bright HUD elements, white menus, or colorful effects** disproportionately intense, even after lowering saturation.
- People who prefer **cool/neutral colors rather than yellow night modes**, but still want less aggressive highlights.
- Anyone who likes experimenting with **personal display comfort**, not just maximizing vibrancy.

**A personal starting point (not a universal preset):** Saturation **90**, Vibrance **-5**, Contrast **-10**, Temperature **+20**, Bright color reduction **5–10**, Highlight start **70**. Change one control at a time and keep whichever settings actually feel comfortable.

> **Important limitations:** This is an **SDR color-mapping adjustment**, not a medical eye-care feature. It is not Apple's proprietary Reduce White Point algorithm. It **does not remove OLED PWM/flicker**, change panel hardware, or guarantee relief from eyestrain or headaches. The reduction percentage controls RGB output values, not measured screen luminance. If symptoms persist, do not force yourself to adapt.

### Installing this fork

Open this repository's [Actions](https://github.com/kamjin3086/decky-screen-colors-enhance/actions/workflows/validate-package.yml) → choose a successful run → download the `decky-screen-colors-white-point` artifact. **Extract the downloaded Actions artifact first**; it contains the actual `decky-screen-colors-white-point.zip` that Decky can install through **Developer → Install Plugin from ZIP**. The upstream installation link in the original README below installs the *original version*, not this fork.

### 中文说明

这个 Fork 来自一次真实的 Steam Deck LCD → OLED 体验：OLED 的色彩、对比度和局部高亮让画面更漂亮，却也可能让部分人感觉刺眼、下意识眯眼；原来的 LCD 反而显得柔和。实际体验中，**小幅降低饱和度、鲜艳度和对比度，就带来了明显的主观舒适度改善**，因此进一步增加了独立的「降低白点值／亮色强度」功能，用于压低仍然突出的亮部，同时尽量保留暗部。

它适合想保留 OLED 优势、却更喜欢 LCD 柔和观感的人，也适合不喜欢偏黄夜间模式、但希望亮色不那么强烈的玩家。**这不是消除 PWM 的功能，也没有医学护眼效果保证**；你的实际感受比任何固定参数都重要。

---

<h1 align="center">Screen Colors</h1>

<p align="center">
  A <b>Decky Loader</b> plugin to adjust the screen colors of handhelds running
  gamescope (Steam Deck and similar) — saturation, vibrance, temperature,
  contrast, gamma, black level, hue and per-channel RGB gains, plus a one-tap
  <b>OLED look</b> and ready-made presets.
</p>

<p align="center">
  <img src="assets/screenshot.png" alt="Screen Colors panel in the Quick Access Menu" width="380">
</p>

<p align="center">
  <a href="https://github.com/PacificSilent/decky-screen-colors/releases/latest">
    <img alt="Latest release" src="https://img.shields.io/github/v/release/PacificSilent/decky-screen-colors?style=flat-square">
  </a>
  <img alt="License" src="https://img.shields.io/badge/license-GPL--3.0--or--later-blue?style=flat-square">
</p>

> 🇪🇸 **[Versión en español más abajo.](#español)**

---

## Features

- **OLED look** — one tap: more color and contrast, to bring an LCD closer to the
  look of an OLED panel.
- **Presets** — Cinema, Vivid and Comfort: complete, ready-made looks.
- **Manual adjustment** — saturation, vibrance, temperature, contrast, gamma and
  black level, applied live.
- **Reduce white point (SDR)** — optionally compress bright whites and strong
  colored highlights without dimming shadows, using two separate controls.
  Set **Bright color reduction** to 0 to disable it completely.
- **Advanced** — hue and per-channel RGB gains, hidden behind a toggle so the
  panel stays simple.
- **It sticks** — your look is saved and re-applied automatically after a reboot,
  a Steam restart, or a trip to Desktop Mode and back.
- **English and Spanish** — the UI follows your Steam language automatically.

## Install

**From the release ZIP (easiest):**

1. In Game Mode, open Decky → gear icon → enable **Developer Mode**.
2. In the **Developer** tab, choose **Install Plugin from ZIP**.
3. Pick [the latest release ZIP](https://github.com/PacificSilent/decky-screen-colors/releases/latest)
   (`decky-screen-colors.zip`).

**Manually:** copy the `Screen Colors` folder from the ZIP into
`~/homebrew/plugins/` on your device and restart the Decky service (or reboot).

## Usage

Open the **Quick Access Menu** (**⋯** button) and pick **Screen Colors**.

| Control | What it does |
| --- | --- |
| **OLED look** | Saturation 120 + contrast 20. It approximates the *color* of an OLED; it cannot give true per-pixel blacks. |
| **Cinema / Vivid / Comfort** | Complete looks: Cinema is warm and contrasty, Vivid pushes color hard, Comfort is warmer and softer for night-time. |
| **Manual adjustment** | Fine-tune each parameter. Changes apply live and are saved. |
| **Bright color reduction** | 0–50; at 10, pure white maps to nominal RGB output 0.90 (not necessarily 10% less emitted light). Default **0**. |
| **Highlight start** | Preferred compression threshold 50–90, default 70. When a high threshold conflicts with strong white reduction, the effective knee moves down automatically to preserve monotonic brightness. |
| **Hue and RGB gains** | White-balance tweaks, for when a panel pulls green or magenta. |
| **Reset to native** | Back to the panel's original color. |

The **Current** line at the top always tells you which look is applied
(*Native*, *OLED look*, a preset, or *Custom*).

## Example: a softer Steam Deck OLED image

Start with the comfortable existing values if you already have them. For example:

- Saturation **90**
- Vibrance **-5**
- Temperature **+20** (positive values in the current color engine increase red
  relative to blue, i.e. physically **warmer**, despite how some screens may feel)
- Contrast **-10**
- Bright color reduction **10**, highlight start **70**

Try white reduction at **0 → 5 → 10**, keeping the other controls fixed.
A setting of 0 retains the previous plugin behavior. This feature is **not**
Apple's proprietary Reduce White Point algorithm, a hardware white-point
calibration, an HDR tone mapper, or a PWM/flicker treatment.

The effect works on normalized, gamma-encoded RGB values **after** the
existing controls. It scales all three channels equally above the highlight
threshold, preserving color ratios and shadow values. The resulting peak
mapping is monotone: bright colors cannot become darker than an otherwise
identical dimmer color. It is intended for **SDR** game output; HDR accuracy
and display-level behavior have not been validated.

## How it works

The plugin generates a **3D LUT (`.cube`)** and loads it through gamescope's
Wayland control socket with `gamescopectl set_look` (hence the root permission).
This is the mechanism that works on current SteamOS — unlike the old X11-atom
approach, which stopped working on modern (Wayland) gamescope.

The LUT lives inside the running gamescope instance, so it is lost whenever
gamescope restarts (reboot, Steam restart, Desktop Mode round-trip). The backend
watches for a new gamescope instance and re-applies your saved look, so you don't
have to touch the panel again after a reboot.

If no responding gamescope socket is present (e.g. in Desktop Mode), the UI says
so and does nothing.

## Build from source

```bash
pnpm install
pnpm run build      # produces dist/index.js
```

Then package `main.py`, `plugin.json`, `package.json`, `dist/`, `LICENSE`,
`CREDITS.md` and `README.md` into a ZIP whose top-level folder is named
`Screen Colors`.

## Credits and license

Written by [PacificSilent](https://github.com/PacificSilent). The color engine is
derived from [panel-de-control](https://github.com/Hooandee/panel-de-control) by
Hooandee (GPL-3.0) — see `CREDITS.md`.

GNU GPL v3.0 or later — see `LICENSE`.

---

<h1 align="center">Español</h1>

Un plugin de **Decky Loader** para ajustar los colores de la pantalla en
portátiles con gamescope (Steam Deck y similares): saturación, vibración,
temperatura, contraste, gamma, nivel de negro, tono y ganancias RGB por canal,
más un **Look OLED** de un toque y perfiles listos para usar.

## Características

- **Look OLED** — de un toque: más color y contraste, para acercar un LCD al
  aspecto de un panel OLED.
- **Perfiles** — Cine, Vivo y Cómodo: looks completos ya calibrados.
- **Ajuste manual** — saturación, vibración, temperatura, contraste, gamma y
  nivel de negro, aplicados en vivo.
- **Avanzado** — tono y ganancias RGB por canal, detrás de un interruptor para
  que el panel siga siendo simple.
- **No se pierde** — tu look se guarda y se vuelve a aplicar solo tras reiniciar
  la consola, reiniciar Steam o volver del Modo Escritorio.
- **Español e inglés** — la interfaz sigue automáticamente el idioma de Steam.

## Instalación

**Desde el ZIP del release (lo más fácil):**

1. En Modo Juego, abre Decky → engranaje → activa **Developer Mode**.
2. En la pestaña **Developer**, usa **Install Plugin from ZIP**.
3. Elige [el ZIP del último release](https://github.com/PacificSilent/decky-screen-colors/releases/latest)
   (`decky-screen-colors.zip`).

**Manual:** copia la carpeta `Screen Colors` del ZIP en `~/homebrew/plugins/` de
tu consola y reinicia el servicio de Decky (o la consola).

## Uso

Abre el **Menú de Acceso Rápido** (botón **⋯**) y entra en **Screen Colors**.

| Control | Qué hace |
| --- | --- |
| **Look OLED** | Saturación 120 + contraste 20. Aproxima el *color* de un OLED; no da negros reales por píxel. |
| **Cine / Vivo / Cómodo** | Looks completos: Cine cálido y contrastado, Vivo empuja el color a tope, Cómodo más cálido y suave para la noche. |
| **Ajuste manual** | Afina cada parámetro. Se aplica en vivo y se guarda. |
| **Tono y ganancias RGB** | Ajustes de balance de blancos, para paneles que tiran a verde o magenta. |
| **Volver al nativo** | Regresa al color original del panel. |

La línea **Actual** de arriba siempre indica qué look está puesto (*Nativo*,
*Look OLED*, un perfil o *Personalizado*).

## Cómo funciona

Genera un **LUT 3D (`.cube`)** y lo carga por el socket de control Wayland de
gamescope con `gamescopectl set_look` (por eso pide permiso de root). Es el
mecanismo vigente en SteamOS actual, a diferencia del método viejo por atom de
X11, que dejó de funcionar en el gamescope moderno (Wayland).

El LUT vive dentro de la instancia de gamescope, así que se pierde cada vez que
gamescope se reinicia (reinicio de la consola, de Steam, o ida y vuelta al Modo
Escritorio). El backend detecta la nueva instancia y vuelve a aplicar tu look
guardado, así que no tienes que abrir el panel otra vez después de reiniciar.

Si no hay un socket de gamescope que responda (p. ej. en Modo Escritorio), la
interfaz lo indica y no hace nada.

## Compilar desde el código

```bash
pnpm install
pnpm run build      # genera dist/index.js
```

Después empaqueta `main.py`, `plugin.json`, `package.json`, `dist/`, `LICENSE`,
`CREDITS.md` y `README.md` en un ZIP cuya carpeta raíz se llame `Screen Colors`.

## Créditos y licencia

Escrito por [PacificSilent](https://github.com/PacificSilent). El motor de color
deriva de [panel-de-control](https://github.com/Hooandee/panel-de-control) de
Hooandee (GPL-3.0) — ver `CREDITS.md`.

GNU GPL v3.0 o posterior — ver `LICENSE`.
