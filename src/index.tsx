import {
  ButtonItem,
  DialogButton,
  DropdownItem,
  Field,
  Focusable,
  PanelSection,
  PanelSectionRow,
  SliderField,
  TextField,
  ToggleField,
  staticClasses,
} from "@decky/ui";
import { callable, definePlugin } from "@decky/api";
import { FC, useEffect, useRef, useState } from "react";
import { FaPalette } from "react-icons/fa";

import { t } from "./i18n";

// ---- RPC bridge (names must match the async def methods on the Python Plugin)
type Color = Record<string, number>;
type UserPreset = { id: string; name: string };
type EditorMode = "closed" | "choose" | "create" | "rename" | "delete";
interface State {
  supported: boolean;
  detail: string;
  color: Color;
  ranges: Record<string, [number, number]>;
  native: Color;
  presets: string[];
  active: string;
  user_presets: UserPreset[];
  selected_user_preset: string | null;
  user_preset_dirty: boolean;
}

const getState = callable<[], State>("get_state");
const setColor = callable<[fields: Color], State>("set_color");
const applyPreset = callable<[key: string], State>("apply_preset");
const applyOledLook = callable<[], State>("apply_oled_look");
const resetColor = callable<[], State>("reset");
const saveUserPreset = callable<[name: string], State>("save_user_preset");
const overwriteUserPreset = callable<[id: string], State>("overwrite_user_preset");
const loadUserPreset = callable<[id: string], State>("load_user_preset");
const renameUserPreset = callable<[id: string, name: string], State>("rename_user_preset");
const deleteUserPreset = callable<[id: string], State>("delete_user_preset");

// Dragging a slider fires a change per step; each one rebuilds a 17^3 LUT on the
// device. Coalesce the changes and push them once the stick settles.
const APPLY_DELAY_MS = 120;

// [field, i18n key, step]
const MAIN: [string, string, number][] = [
  ["saturation", "field.saturation", 5],
  ["vibrance", "field.vibrance", 5],
  ["temperature", "field.temperature", 5],
  ["contrast", "field.contrast", 2],
  ["gamma", "field.gamma", 5],
  ["black", "field.black", 5],
];
// White reduction is separate from temperature/white balance.
// Keep it in its own section so users can A/B test highlights independently.
const HIGHLIGHTS: [string, string, number][] = [
  ["white_reduction", "field.whiteReduction", 1],
  ["white_threshold", "field.whiteThreshold", 5],
];
const ADVANCED: [string, string, number][] = [
  ["hue", "field.hue", 5],
  ["gain_r", "field.gain_r", 2],
  ["gain_g", "field.gain_g", 2],
  ["gain_b", "field.gain_b", 2],
];

/** Human-readable name of the look that is currently applied. */
const activeLabel = (active: string) =>
  active === "native" || active === "custom" || active === "oled"
    ? t(`active.${active}`)
    : t(`preset.${active}`);

const ColorPanel: FC = () => {
  const [state, setState] = useState<State | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("closed");
  const [draftName, setDraftName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef<Color>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void>>(Promise.resolve());

  // Serialize changes: save/load must see the last slider position, even if
  // the debounced LUT update is still in flight.
  const flush = (): Promise<void> => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const fields = pending.current;
    pending.current = {};
    if (!Object.keys(fields).length) return inFlight.current;

    const task = inFlight.current.then(async () => {
      const s = await setColor(fields);
      setState({ ...s, color: { ...s.color, ...pending.current } });
    });
    // Keep a recovered queue for subsequent operations; return the original
    // task so errors can still be surfaced by the caller.
    inFlight.current = task.catch(() => undefined);
    return task;
  };

  useEffect(() => {
    getState().then(setState).catch(() => setState(null));
    return () => {
      // Panel unmount can happen immediately after a controller adjustment.
      void flush().catch(() => undefined);
    };
  }, []);

  const openEditor = (mode: EditorMode, name = "") => {
    setDraftName(name);
    setError("");
    setEditorMode(mode);
  };

  const run = async (call: () => Promise<State>): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      await flush();
      setState(await call());
      setEditorMode("closed");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!state) {
    return (
      <PanelSection title={t("title")} spinner>
        <PanelSectionRow>{t("loading")}</PanelSectionRow>
      </PanelSection>
    );
  }

  if (!state.supported) {
    return (
      <PanelSection title={t("title")}>
        <PanelSectionRow>{t("unsupported.body")}</PanelSectionRow>
        <PanelSectionRow>
          <span style={{ opacity: 0.6, fontSize: "0.75em" }}>{state.detail}</span>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  const change = (f: string, v: number) => {
    if (busy) return;
    setState((s) => (s ? { ...s, color: { ...s.color, [f]: v }, active: "custom",
      user_preset_dirty: s.selected_user_preset !== null } : s));
    pending.current[f] = v;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush().catch(() => undefined); }, APPLY_DELAY_MS);
  };

  const slider = ([f, key, step]: [string, string, number]) => {
    const [min, max] = state.ranges[f] ?? [0, 100];
    return (
      <PanelSectionRow key={f}>
        <SliderField
          label={t(key)}
          value={state.color[f]}
          min={min}
          max={max}
          step={step}
          resetValue={state.native[f]}
          disabled={busy}
          showValue
          onChange={(v) => change(f, v)}
        />
      </PanelSectionRow>
    );
  };

  const selectedPreset = state.user_presets.find(
    (p) => p.id === state.selected_user_preset
  );
  const submitName = () => {
    if (!draftName.trim()) {
      setError(t("my.error.empty"));
      return;
    }
    if (editorMode === "rename" && selectedPreset) {
      void run(() => renameUserPreset(selectedPreset.id, draftName));
    } else if (editorMode === "create") {
      void run(() => saveUserPreset(draftName));
    }
  };
  const miniButton = { flex: 1, minWidth: 0, padding: "8px 4px", fontSize: "0.84em" };

  return (
    <>
      <PanelSection title={t("section.presets")}>
        <PanelSectionRow>
          <Field label={t("label.active")} childrenLayout="inline" bottomSeparator="thick">
            <span style={{ fontWeight: "bold" }}>
              {selectedPreset
                ? `${selectedPreset.name}${state.user_preset_dirty ? " *" : ""}`
                : activeLabel(state.active)}
            </span>
          </Field>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            description={t("btn.oledLook.desc")}
            onClick={() => run(applyOledLook)}
          >
            {state.active === "oled" ? `✓ ${t("btn.oledLook")}` : t("btn.oledLook")}
          </ButtonItem>
        </PanelSectionRow>

        <PanelSectionRow>
          <Focusable style={{ display: "flex", gap: "6px" }}>
            {state.presets.map((k) => (
              <DialogButton
                key={k}
                style={{ flex: 1, minWidth: 0, padding: "8px 4px", fontSize: "0.85em" }}
                onClick={() => run(() => applyPreset(k))}
              >
                {state.active === k ? `✓ ${t(`preset.${k}`)}` : t(`preset.${k}`)}
              </DialogButton>
            ))}
          </Focusable>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={state.active === "native"}
            onClick={() => run(resetColor)}
          >
            {t("btn.reset")}
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title={t("section.myPresets")}>
        <PanelSectionRow>
          {state.user_presets.length ? (
            <DropdownItem
              label={t("my.switch")}
              rgOptions={[
                { data: "", label: t("my.pick") },
                ...state.user_presets.map((p) => ({
                  data: p.id,
                  label: p.name,
                })),
              ]}
              selectedOption={state.selected_user_preset ?? ""}
              disabled={busy}
              onChange={(option) => {
                const id = String(option.data);
                if (id && (id !== state.selected_user_preset || state.user_preset_dirty)) {
                  void run(() => loadUserPreset(id));
                }
              }}
            />
          ) : (
            <span style={{ opacity: 0.7, fontSize: "0.82em" }}>
              {t("my.empty")}
            </span>
          )}
        </PanelSectionRow>
        {selectedPreset && state.user_preset_dirty && (
          <PanelSectionRow>
            <ButtonItem disabled={busy} layout="below"
              description={t("my.dirty")}
              onClick={() => void run(() => loadUserPreset(selectedPreset.id))}>
              {t("my.restore")}
            </ButtonItem>
          </PanelSectionRow>
        )}
        <PanelSectionRow>
          <Focusable style={{ display: "flex", gap: "6px" }}>
            <DialogButton style={miniButton} disabled={busy}
              onClick={() => openEditor(selectedPreset ? "choose" : "create")}>
              {t("my.save")}
            </DialogButton>
            {selectedPreset && (
              <>
                <DialogButton style={miniButton} disabled={busy}
                  onClick={() => openEditor("rename", selectedPreset.name)}>
                  {t("my.rename")}
                </DialogButton>
                <DialogButton style={miniButton} disabled={busy}
                  onClick={() => openEditor("delete")}>
                  {t("my.delete")}
                </DialogButton>
              </>
            )}
          </Focusable>
        </PanelSectionRow>
        {editorMode === "choose" && selectedPreset && (
          <>
            <PanelSectionRow>
              <span style={{ fontSize: "0.85em" }}>
                {t("my.choose").replace("{name}", selectedPreset.name)}
              </span>
            </PanelSectionRow>
            <PanelSectionRow>
              <Focusable style={{ display: "flex", gap: "6px" }}>
                <DialogButton style={miniButton} disabled={busy}
                  onClick={() => void run(() => overwriteUserPreset(selectedPreset.id))}>
                  {t("my.overwrite")}
                </DialogButton>
                <DialogButton style={miniButton} disabled={busy}
                  onClick={() => openEditor("create")}>
                  {t("my.new")}
                </DialogButton>
                <DialogButton style={miniButton} disabled={busy}
                  onClick={() => openEditor("closed")}>
                  {t("my.cancel")}
                </DialogButton>
              </Focusable>
            </PanelSectionRow>
          </>
        )}
        {(editorMode === "create" || editorMode === "rename") && (
          <>
            <PanelSectionRow>
              <TextField
                label={editorMode === "rename" ? t("my.renamePrompt") : t("my.namePrompt")}
                placeholder={t("my.namePlaceholder")}
                maxLength={40}
                value={draftName}
                onChange={(event) => setDraftName(event.currentTarget.value)}
                disabled={busy}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <Focusable style={{ display: "flex", gap: "6px" }}>
                <DialogButton style={miniButton} disabled={busy}
                  onClick={submitName}>
                  {editorMode === "rename" ? t("my.rename") : t("my.save")}
                </DialogButton>
                <DialogButton style={miniButton} disabled={busy}
                  onClick={() => openEditor("closed")}>
                  {t("my.cancel")}
                </DialogButton>
              </Focusable>
            </PanelSectionRow>
          </>
        )}
        {editorMode === "delete" && selectedPreset && (
          <>
            <PanelSectionRow>
              <span style={{ fontSize: "0.85em" }}>
                {t("my.deleteConfirm").replace("{name}", selectedPreset.name)}
              </span>
            </PanelSectionRow>
            <PanelSectionRow>
              <Focusable style={{ display: "flex", gap: "6px" }}>
                <DialogButton style={miniButton} disabled={busy}
                  onClick={() => void run(() => deleteUserPreset(selectedPreset.id))}>
                  {t("my.delete")}
                </DialogButton>
                <DialogButton style={miniButton} disabled={busy}
                  onClick={() => openEditor("closed")}>
                  {t("my.cancel")}
                </DialogButton>
              </Focusable>
            </PanelSectionRow>
          </>
        )}
        {error && (
          <PanelSectionRow>
            <span style={{ color: "#f3a6a6", fontSize: "0.82em" }}>{error}</span>
          </PanelSectionRow>
        )}
      </PanelSection>

      <PanelSection title={t("section.manual")}>{MAIN.map(slider)}</PanelSection>

      <PanelSection title={t("section.highlights")}>
        <PanelSectionRow>
          <span style={{ opacity: 0.75, fontSize: "0.8em" }}>
            {t("section.highlights.desc")}
          </span>
        </PanelSectionRow>
        {HIGHLIGHTS.map(slider)}
      </PanelSection>

      <PanelSection title={t("section.advanced")}>
        <PanelSectionRow>
          <ToggleField
            label={t("toggle.advanced")}
            description={showAdvanced ? undefined : t("toggle.advanced.desc")}
            checked={showAdvanced}
            onChange={setShowAdvanced}
          />
        </PanelSectionRow>
        {showAdvanced && ADVANCED.map(slider)}
      </PanelSection>
    </>
  );
};

export default definePlugin(() => ({
  name: "Screen Colors",
  titleView: <div className={staticClasses.Title}>{t("title")}</div>,
  content: <ColorPanel />,
  icon: <FaPalette />,
}));
