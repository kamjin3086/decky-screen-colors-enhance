// Lightweight i18n. Language is picked once, automatically, from the Steam client
// UI language (navigator.language in the CEF runtime): "es*" -> Spanish, else English.

type Lang = "en" | "es";

const DICT: Record<Lang, Record<string, string>> = {
  en: {
    "title": "Screen Colors",
    "loading": "Loading…",
    "unsupported.body":
      "No responding gamescope socket was found, so color adjustment isn't available in this session. This works in Game Mode (gamescope), not in Desktop Mode.",

    "section.presets": "Presets",
    "section.myPresets": "My presets",
    "my.switch": "Switch preset",
    "my.pick": "Choose a saved preset",
    "my.empty": "No personal presets yet. Save your current settings to create one.",
    "my.save": "Save",
    "my.rename": "Rename",
    "my.delete": "Delete",
    "my.restore": "Revert to saved",
    "my.dirty": "Current sliders differ from the saved preset.",
    "my.choose": "Save changes to \"{name}\"?",
    "my.overwrite": "Overwrite",
    "my.new": "Save as new",
    "my.cancel": "Cancel",
    "my.namePrompt": "New preset name",
    "my.renamePrompt": "Rename preset",
    "my.namePlaceholder": "e.g. Soft evenings",
    "my.deleteConfirm": "Delete \"{name}\"? Your current screen settings will stay as they are.",
    "my.error.empty": "Enter a preset name.",

    "section.manual": "Manual adjustment",
    "section.advanced": "Advanced",
    "section.highlights": "Reduce white point",
    "section.highlights.desc": "Softens bright whites and vivid highlights while keeping shadows. Not a PWM fix. Reduction 0 restores the original output.",

    "label.active": "Current",
    "active.native": "Native",
    "active.custom": "Custom",
    "active.oled": "OLED look",

    "btn.oledLook": "OLED look",
    "btn.oledLook.desc": "More color and contrast, in one tap.",
    "btn.reset": "Reset to native",

    "toggle.advanced": "Hue and RGB gains",
    "toggle.advanced.desc": "Fine white-balance tweaks. Leave off unless you need them.",

    "preset.cine": "Cinema",
    "preset.vivo": "Vivid",
    "preset.comodo": "Comfort",

    "field.saturation": "Saturation",
    "field.vibrance": "Vibrance",
    "field.temperature": "Temperature (warm/cool)",
    "field.contrast": "Contrast",
    "field.gamma": "Brightness (gamma)",
    "field.black": "Black level",
    "field.whiteReduction": "Bright color reduction (%)",
    "field.whiteThreshold": "Highlight start (%)",
    "field.hue": "Hue",
    "field.gain_r": "Red gain",
    "field.gain_g": "Green gain",
    "field.gain_b": "Blue gain",
  },
  es: {
    "title": "Screen Colors",
    "loading": "Cargando…",
    "unsupported.body":
      "No se detecta un socket de gamescope que responda, así que el ajuste de color no está disponible en esta sesión. Esto funciona en Modo Juego (gamescope), no en Modo Escritorio.",

    "section.presets": "Perfiles",
    "section.myPresets": "Mis perfiles",
    "my.switch": "Cambiar perfil",
    "my.pick": "Elige un perfil guardado",
    "my.empty": "Aún no hay perfiles personales. Guarda tus ajustes para crear uno.",
    "my.save": "Guardar",
    "my.rename": "Renombrar",
    "my.delete": "Eliminar",
    "my.restore": "Restaurar guardado",
    "my.dirty": "Los ajustes actuales difieren del perfil guardado.",
    "my.choose": "¿Guardar los cambios en \"{name}\"?",
    "my.overwrite": "Sobrescribir",
    "my.new": "Guardar como nuevo",
    "my.cancel": "Cancelar",
    "my.namePrompt": "Nombre del nuevo perfil",
    "my.renamePrompt": "Renombrar perfil",
    "my.namePlaceholder": "Ej. Noches suaves",
    "my.deleteConfirm": "¿Eliminar \"{name}\"? Los colores actuales no cambiarán.",
    "my.error.empty": "Escribe un nombre para el perfil.",

    "section.manual": "Ajuste manual",
    "section.advanced": "Avanzado",
    "section.highlights": "Reducir punto blanco",
    "section.highlights.desc": "Suaviza blancos y altas luces sin alterar las sombras. No corrige el PWM. El valor 0 desactiva el efecto.",

    "label.active": "Actual",
    "active.native": "Nativo",
    "active.custom": "Personalizado",
    "active.oled": "Look OLED",

    "btn.oledLook": "Look OLED",
    "btn.oledLook.desc": "Más color y contraste, de un toque.",
    "btn.reset": "Volver al nativo",

    "toggle.advanced": "Tono y ganancias RGB",
    "toggle.advanced.desc": "Ajustes finos de balance de blancos. Déjalo apagado si no los necesitas.",

    "preset.cine": "Cine",
    "preset.vivo": "Vivo",
    "preset.comodo": "Cómodo",

    "field.saturation": "Saturación",
    "field.vibrance": "Vibración",
    "field.temperature": "Temperatura (cálido/frío)",
    "field.contrast": "Contraste",
    "field.gamma": "Brillo (gamma)",
    "field.black": "Nivel de negro",
    "field.whiteReduction": "Reducción de colores brillantes (%)",
    "field.whiteThreshold": "Inicio de altas luces (%)",
    "field.hue": "Tono",
    "field.gain_r": "Ganancia rojo",
    "field.gain_g": "Ganancia verde",
    "field.gain_b": "Ganancia azul",
  },
};

function detectLang(): Lang {
  try {
    const langs = [
      ...(navigator.languages ?? []),
      navigator.language,
    ].filter(Boolean) as string[];
    if (langs.some((l) => l.toLowerCase().startsWith("es"))) return "es";
  } catch {
    /* navigator may be unavailable in some contexts */
  }
  return "en";
}

const LANG: Lang = detectLang();

/** Translate a key to the detected UI language (falls back to English, then the key). */
export function t(key: string): string {
  return DICT[LANG][key] ?? DICT.en[key] ?? key;
}
