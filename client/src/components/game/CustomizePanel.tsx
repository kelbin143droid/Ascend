import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, Sparkles, Upload, RotateCcw, Image as ImageIcon, Type, Check, Save } from "lucide-react";
import {
  useTheme,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  FontFamilyKey,
  FontSizeKey,
} from "@/context/ThemeContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#00d4ff", "#3FB6FF", "#a855f7", "#f4845f", "#c084fc",
  "#ff3333", "#ffd700", "#34d399", "#06b6d4", "#ec4899",
];

const DEFAULT_THEME_IDS = ["male", "female"];

const MAX_BG_BYTES = 900_000; // ~880 KB to stay safely under localStorage quota

/**
 * Re-encodes an uploaded image into a JPEG sized to fit the screen so the
 * data URL stays small enough for localStorage. Returns the data URL.
 */
async function processBackgroundImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Failed to load image"));
      i.src = url;
    });
    const maxDim = 1600;
    const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported on this device.");
    ctx.drawImage(img, 0, 0, w, h);

    let quality = 0.78;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > MAX_BG_BYTES && quality > 0.35) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    if (dataUrl.length > MAX_BG_BYTES) {
      throw new Error("Image is too large. Try a smaller picture.");
    }
    // Free the canvas backing memory on mobile.
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function CustomizePanel({ open, onClose }: Props) {
  const {
    theme,
    backgroundTheme,
    setBackgroundTheme,
    setClockTheme,
    allThemes,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    customBackgroundImage,
    setCustomBackgroundImage,
    customPrimaryColor,
    setCustomPrimaryColor,
    customTextColor,
    setCustomTextColor,
    resetCustomization,
  } = useTheme();

  const [tab, setTab] = useState<"themes" | "custom">("themes");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const colors = theme.colors;

  // Draft state for the Custom tab — only commits on Save.
  const [draftBgImage, setDraftBgImage] = useState<string | null>(customBackgroundImage);
  const [draftPrimary, setDraftPrimary] = useState<string | null>(customPrimaryColor);
  const [draftText, setDraftText] = useState<string | null>(customTextColor);
  const [draftFontFamily, setDraftFontFamily] = useState<FontFamilyKey>(fontFamily);
  const [draftFontSize, setDraftFontSize] = useState<FontSizeKey>(fontSize);

  // Whenever the panel opens, snap the draft to the currently saved values
  // so a previous unsaved session doesn't leak into a new one.
  useEffect(() => {
    if (open) {
      setDraftBgImage(customBackgroundImage);
      setDraftPrimary(customPrimaryColor);
      setDraftText(customTextColor);
      setDraftFontFamily(fontFamily);
      setDraftFontSize(fontSize);
      setUploadError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isDirty =
    draftBgImage !== customBackgroundImage ||
    draftPrimary !== customPrimaryColor ||
    draftText !== customTextColor ||
    draftFontFamily !== fontFamily ||
    draftFontSize !== fontSize;

  const defaultThemes = allThemes.filter((t) => DEFAULT_THEME_IDS.includes(t.id));

  const handleApplyDefault = (id: string) => {
    setBackgroundTheme(id);
    setClockTheme(id);
    // Clear custom overrides so the chosen theme shows cleanly.
    setCustomPrimaryColor(null);
    setCustomTextColor(null);
    setDraftPrimary(null);
    setDraftText(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await processBackgroundImage(file);
      setDraftBgImage(dataUrl);
    } catch (err: any) {
      setUploadError(err?.message || "Could not load image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = () => {
    setCustomBackgroundImage(draftBgImage);
    setCustomPrimaryColor(draftPrimary);
    setCustomTextColor(draftText);
    setFontFamily(draftFontFamily);
    setFontSize(draftFontSize);
    setShowSavedToast(true);
    window.setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 700);
  };

  const handleCancel = () => {
    // Discard draft; pop back to the saved values.
    setDraftBgImage(customBackgroundImage);
    setDraftPrimary(customPrimaryColor);
    setDraftText(customTextColor);
    setDraftFontFamily(fontFamily);
    setDraftFontSize(fontSize);
    onClose();
  };

  const handleResetDraft = () => {
    setDraftBgImage(null);
    setDraftPrimary(null);
    setDraftText(null);
    setDraftFontFamily("system");
    setDraftFontSize("md");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          data-testid="customize-panel"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 22 }}
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[88vh] overflow-y-auto"
            style={{
              backgroundColor: colors.background,
              border: `1px solid ${colors.surfaceBorder}`,
              boxShadow: `0 -10px 40px rgba(0,0,0,0.4)`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Palette size={18} style={{ color: colors.primary }} />
                <h2
                  className="text-base font-display tracking-wider"
                  style={{ color: colors.text }}
                >
                  CUSTOMIZE
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: colors.surface,
                  color: colors.textMuted,
                  border: `1px solid ${colors.surfaceBorder}`,
                }}
                data-testid="button-customize-close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1 p-1 rounded-lg mb-4"
              style={{
                backgroundColor: "rgba(0,0,0,0.25)",
                border: `1px solid ${colors.surfaceBorder}`,
              }}
            >
              <button
                onClick={() => setTab("themes")}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-display tracking-wider transition-all"
                style={
                  tab === "themes"
                    ? { backgroundColor: colors.primary, color: colors.background }
                    : { color: colors.textMuted }
                }
                data-testid="tab-default-themes"
              >
                <Sparkles size={12} />
                DEFAULT THEMES
              </button>
              <button
                onClick={() => setTab("custom")}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-display tracking-wider transition-all"
                style={
                  tab === "custom"
                    ? { backgroundColor: colors.primary, color: colors.background }
                    : { color: colors.textMuted }
                }
                data-testid="tab-custom"
              >
                <Palette size={12} />
                CUSTOM
              </button>
            </div>

            {tab === "themes" ? (
              <div className="space-y-3" data-testid="section-default-themes">
                <p className="text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>
                  Pick one of the curated themes below. More are coming soon.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {defaultThemes.map((t) => {
                    const isSelected = backgroundTheme.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleApplyDefault(t.id)}
                        className="relative p-4 rounded-xl text-left transition-all active:scale-[0.99]"
                        style={{
                          background: t.colors.backgroundGradient,
                          border: isSelected
                            ? `2px solid ${t.colors.primary}`
                            : `1px solid ${t.colors.surfaceBorder}`,
                          boxShadow: isSelected
                            ? `0 0 22px ${t.colors.primaryGlow}`
                            : "none",
                        }}
                        data-testid={`button-default-theme-${t.id}`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{t.icon}</span>
                          <div>
                            <div
                              className="font-display text-sm tracking-wider"
                              style={{ color: t.colors.primary }}
                            >
                              {t.name}
                            </div>
                            <div className="text-[10px]" style={{ color: t.colors.textMuted }}>
                              {t.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <ColorSwatch color={t.colors.primary} />
                          <ColorSwatch color={t.colors.secondary} />
                          <ColorSwatch color={t.colors.accent} />
                          <ColorSwatch color={t.colors.surface} />
                        </div>
                        {isSelected && (
                          <div
                            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: t.colors.primary, color: t.colors.background }}
                          >
                            <Check size={12} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-5" data-testid="section-custom">
                {/* Background image */}
                <Section title="Background image" icon={<ImageIcon size={12} />} colors={colors}>
                  {draftBgImage ? (
                    <div
                      className="relative rounded-lg overflow-hidden"
                      style={{ border: `1px solid ${colors.surfaceBorder}` }}
                    >
                      <div
                        className="w-full h-28"
                        style={{
                          backgroundImage: `url("${draftBgImage}")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                        data-testid="preview-bg-image"
                      />
                      <div className="flex gap-2 p-2" style={{ backgroundColor: colors.surface }}>
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="flex-1 text-xs py-1.5 rounded-md"
                          style={{
                            backgroundColor: `${colors.primary}20`,
                            color: colors.primary,
                            border: `1px solid ${colors.primary}40`,
                          }}
                          data-testid="button-replace-bg"
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => setDraftBgImage(null)}
                          className="flex-1 text-xs py-1.5 rounded-md"
                          style={{
                            backgroundColor: "rgba(255,80,80,0.15)",
                            color: "#ff8080",
                            border: "1px solid rgba(255,80,80,0.3)",
                          }}
                          data-testid="button-remove-bg"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-6 rounded-lg flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.99]"
                      style={{
                        backgroundColor: colors.surface,
                        border: `1.5px dashed ${colors.surfaceBorder}`,
                        color: colors.textMuted,
                      }}
                      data-testid="button-upload-bg"
                    >
                      <Upload size={18} style={{ color: colors.primary }} />
                      <span className="text-xs">
                        {uploading ? "Processing..." : "Upload your own background"}
                      </span>
                      <span className="text-[10px]">Auto-fits to your screen</span>
                    </button>
                  )}
                  {uploadError && (
                    <p className="text-[10px] mt-1" style={{ color: "#ff8080" }}>
                      {uploadError}
                    </p>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                    data-testid="input-bg-file"
                  />
                </Section>

                {/* Primary accent */}
                <Section title="Primary accent" colors={colors}>
                  <ColorRow
                    value={draftPrimary}
                    onChange={setDraftPrimary}
                    onClear={() => setDraftPrimary(null)}
                    presets={PRESET_COLORS}
                    colors={colors}
                    testid="row-primary-color"
                  />
                </Section>

                {/* Text color */}
                <Section title="Text color" colors={colors}>
                  <ColorRow
                    value={draftText}
                    onChange={setDraftText}
                    onClear={() => setDraftText(null)}
                    presets={["#ffffff", "#e2e8f0", "#cbd5e1", "#fef3c7", "#0f172a", "#1e293b", "#2d1b4e"]}
                    colors={colors}
                    testid="row-text-color"
                  />
                </Section>

                {/* Font family */}
                <Section title="Font" icon={<Type size={12} />} colors={colors}>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_FAMILY_OPTIONS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setDraftFontFamily(f.key as FontFamilyKey)}
                        className="px-3 py-2 rounded-lg text-sm transition-all active:scale-[0.98]"
                        style={{
                          backgroundColor:
                            draftFontFamily === f.key
                              ? `${colors.primary}20`
                              : colors.surface,
                          border: `1px solid ${
                            draftFontFamily === f.key ? colors.primary : colors.surfaceBorder
                          }`,
                          color: colors.text,
                          fontFamily: f.stack,
                        }}
                        data-testid={`button-font-${f.key}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Font size */}
                <Section title="Font size" colors={colors}>
                  <div className="grid grid-cols-4 gap-2">
                    {FONT_SIZE_OPTIONS.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setDraftFontSize(s.key as FontSizeKey)}
                        className="px-2 py-2 rounded-lg transition-all active:scale-[0.98]"
                        style={{
                          backgroundColor:
                            draftFontSize === s.key ? `${colors.primary}20` : colors.surface,
                          border: `1px solid ${
                            draftFontSize === s.key ? colors.primary : colors.surfaceBorder
                          }`,
                          color: colors.text,
                          fontSize: `${Math.max(11, s.px - 2)}px`,
                        }}
                        data-testid={`button-fontsize-${s.key}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Reset draft to plain defaults */}
                <button
                  onClick={handleResetDraft}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    color: colors.textMuted,
                    border: `1px dashed ${colors.surfaceBorder}`,
                  }}
                  data-testid="button-reset-customization"
                >
                  <RotateCcw size={12} />
                  Reset to defaults
                </button>

                {/* Spacer so the sticky footer doesn't overlap the last item */}
                <div className="h-16" />
              </div>
            )}

            {/* Sticky Save / Cancel footer (Custom tab only) */}
            {tab === "custom" && (
              <div
                className="sticky bottom-0 left-0 right-0 -mx-5 -mb-5 px-5 py-3 flex gap-2"
                style={{
                  backgroundColor: colors.background,
                  borderTop: `1px solid ${colors.surfaceBorder}`,
                  boxShadow: "0 -8px 20px rgba(0,0,0,0.35)",
                }}
              >
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-lg text-sm font-display tracking-wider"
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.textMuted,
                    border: `1px solid ${colors.surfaceBorder}`,
                  }}
                  data-testid="button-cancel-customize"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isDirty}
                  className="flex-[1.4] py-3 rounded-lg text-sm font-display tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  style={{
                    backgroundColor: isDirty ? colors.primary : `${colors.primary}40`,
                    color: colors.background,
                    boxShadow: isDirty ? `0 0 18px ${colors.primaryGlow}` : "none",
                    opacity: isDirty ? 1 : 0.6,
                  }}
                  data-testid="button-save-customize"
                >
                  <Save size={14} />
                  {showSavedToast ? "SAVED" : "SAVE CHANGES"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ColorSwatch({ color }: { color: string }) {
  return (
    <div
      className="w-5 h-5 rounded-full"
      style={{ backgroundColor: color, border: "1px solid rgba(255,255,255,0.15)" }}
    />
  );
}

function Section({
  title,
  icon,
  children,
  colors,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <div>
      <div
        className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-widest"
        style={{ color: colors.textMuted }}
      >
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function ColorRow({
  value,
  onChange,
  onClear,
  presets,
  colors,
  testid,
}: {
  value: string | null;
  onChange: (hex: string) => void;
  onClear: () => void;
  presets: string[];
  colors: any;
  testid: string;
}) {
  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-lg"
      style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
      data-testid={testid}
    >
      <div className="flex items-center justify-between">
        <input
          type="color"
          value={value || "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
        />
        {value && (
          <button
            onClick={onClear}
            className="text-[10px] px-2 py-1 rounded"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              color: colors.textMuted,
              border: `1px solid ${colors.surfaceBorder}`,
            }}
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="w-6 h-6 rounded-full transition-transform active:scale-90"
            style={{
              backgroundColor: p,
              border: value?.toLowerCase() === p.toLowerCase()
                ? "2px solid #ffffff"
                : "1px solid rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
