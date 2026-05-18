import { useState, useCallback, useRef } from "react";
import * as THREE from "three";
import { buildHeightmapGeometry, validateMesh, type MeshValidation } from "@/lib/geometry";
import ImageUploader from "@/components/ImageUploader";
import Viewer3D from "@/components/Viewer3D";
import { SliderField, ToggleField, SelectField, Section } from "@/components/ControlPanel";
import ValidationPanel from "@/components/ValidationPanel";
import ExportPanel from "@/components/ExportPanel";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Grid2x2, Eye, Layers, RefreshCw } from "lucide-react";

interface ConversionSettings {
  conversionMode: string;
  extrusionDepth: number;
  invertHeight: boolean;
  smoothingLevel: number;
  baseThickness: number;
  addBase: boolean;
  scaleX: number;
  scaleY: number;
  resolution: number;
}

const DEFAULT_SETTINGS: ConversionSettings = {
  conversionMode: "heightmap",
  extrusionDepth: 5,
  invertHeight: false,
  smoothingLevel: 1,
  baseThickness: 1.5,
  addBase: true,
  scaleX: 50,
  scaleY: 50,
  resolution: 128,
};

export default function EditorPage() {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [validation, setValidation] = useState<MeshValidation | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [converting, setConverting] = useState(false);
  const [projectName, setProjectName] = useState("My Model");
  const { toast } = useToast();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const set = (partial: Partial<ConversionSettings>) =>
    setSettings((s) => ({ ...s, ...partial }));

  const handleImageLoaded = useCallback((data: ImageData, file: File) => {
    setImageData(data);
    // Build preview URL
    const canvas = document.createElement("canvas");
    canvas.width = data.width;
    canvas.height = data.height;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(data, 0, 0);
    setImagePreview(canvas.toDataURL());
    setProjectName(file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "));
    toast({ title: "Image loaded", description: `${data.width}×${data.height}px` });
  }, [toast]);

  const handleConvert = useCallback(() => {
    if (!imageData) return;
    setConverting(true);
    // Defer to next tick so UI updates
    requestAnimationFrame(() => {
      try {
        const s = settingsRef.current;
        const geo = buildHeightmapGeometry(imageData, {
          extrusionDepth: s.extrusionDepth,
          baseThickness: s.baseThickness,
          addBase: s.addBase,
          invert: s.invertHeight,
          smoothingLevel: s.smoothingLevel,
          resolution: s.resolution,
          scaleX: s.scaleX,
          scaleY: s.scaleY,
        });
        setGeometry(geo);
        const v = validateMesh(geo);
        setValidation(v);
        if (v.warnings.length === 0) {
          toast({ title: "Conversion complete", description: `${v.triangles.toLocaleString()} triangles` });
        } else {
          toast({ title: "Converted with warnings", description: `${v.warnings.length} issue(s) detected`, variant: "destructive" });
        }
      } catch (e: any) {
        toast({ title: "Conversion failed", description: e.message, variant: "destructive" });
      } finally {
        setConverting(false);
      }
    });
  }, [imageData, toast]);

  return (
    <div className="flex h-full" style={{ height: "calc(100dvh - 49px)" }}>
      {/* Left panel — controls */}
      <aside
        className="flex flex-col gap-4 overflow-y-auto p-4"
        style={{
          width: 280,
          flexShrink: 0,
          background: "hsl(220 13% 9%)",
          borderRight: "1px solid hsl(220 10% 15%)",
        }}
      >
        {/* Project name */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "hsl(210 15% 55%)" }}>Project name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded text-sm focus:outline-none"
            style={{
              background: "hsl(220 12% 14%)",
              border: "1px solid hsl(220 10% 22%)",
              color: "hsl(210 20% 85%)",
            }}
            data-testid="input-project-name"
          />
        </div>

        {/* Image upload */}
        <Section title="Source Image">
          <ImageUploader
            onImageLoaded={handleImageLoaded}
            currentImage={imagePreview}
            onClear={() => {
              setImageData(null);
              setImagePreview(null);
              setGeometry(null);
              setValidation(null);
            }}
          />
        </Section>

        {/* Conversion mode */}
        <Section title="Conversion Mode">
          <SelectField
            label="Mode"
            value={settings.conversionMode}
            options={[
              { value: "heightmap", label: "Heightmap / Lithophane" },
              { value: "extrusion", label: "Silhouette Extrusion" },
            ]}
            onChange={(v) => set({ conversionMode: v })}
            testId="select-conversion-mode"
          />
          <ToggleField
            label="Invert height"
            value={settings.invertHeight}
            onChange={(v) => set({ invertHeight: v })}
            testId="toggle-invert-height"
          />
        </Section>

        {/* Geometry */}
        <Section title="Geometry">
          <SliderField
            label="Extrusion depth"
            value={settings.extrusionDepth}
            min={0.5}
            max={30}
            step={0.5}
            unit=" mm"
            onChange={(v) => set({ extrusionDepth: v })}
            testId="slider-extrusion-depth"
          />
          <SliderField
            label="Width (X)"
            value={settings.scaleX}
            min={10}
            max={200}
            step={1}
            unit=" mm"
            onChange={(v) => set({ scaleX: v })}
            testId="slider-scale-x"
          />
          <SliderField
            label="Depth (Y)"
            value={settings.scaleY}
            min={10}
            max={200}
            step={1}
            unit=" mm"
            onChange={(v) => set({ scaleY: v })}
            testId="slider-scale-y"
          />
          <SliderField
            label="Resolution"
            value={settings.resolution}
            min={32}
            max={256}
            step={32}
            unit=" pts"
            onChange={(v) => set({ resolution: v })}
            testId="slider-resolution"
          />
        </Section>

        {/* Base */}
        <Section title="Base Plate">
          <ToggleField
            label="Add base plate"
            value={settings.addBase}
            onChange={(v) => set({ addBase: v })}
            testId="toggle-add-base"
          />
          {settings.addBase && (
            <SliderField
              label="Base thickness"
              value={settings.baseThickness}
              min={0.5}
              max={10}
              step={0.5}
              unit=" mm"
              onChange={(v) => set({ baseThickness: v })}
              testId="slider-base-thickness"
            />
          )}
        </Section>

        {/* Smoothing */}
        <Section title="Post-processing">
          <SliderField
            label="Smoothing"
            value={settings.smoothingLevel}
            min={0}
            max={5}
            step={1}
            unit="×"
            onChange={(v) => set({ smoothingLevel: v })}
            testId="slider-smoothing"
          />
        </Section>

        {/* Convert button */}
        <button
          onClick={handleConvert}
          disabled={!imageData || converting}
          className="w-full py-2.5 rounded-md font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: imageData && !converting ? "hsl(185 90% 42%)" : undefined,
            color: "hsl(220 14% 8%)",
          }}
          data-testid="button-convert"
        >
          {converting ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              Converting…
            </>
          ) : (
            <>
              <Wand2 size={15} />
              Convert to 3D
            </>
          )}
        </button>
      </aside>

      {/* Center — 3D viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-4 py-2 border-b"
          style={{ borderColor: "hsl(220 10% 15%)", background: "hsl(220 13% 9%)" }}
        >
          <span className="text-xs font-medium mr-auto" style={{ color: "hsl(210 10% 45%)" }}>
            3D Preview
          </span>
          <ViewerToggle icon={<Grid2x2 size={14} />} label="Grid" active={showGrid} onClick={() => setShowGrid(!showGrid)} />
          <ViewerToggle icon={<Layers size={14} />} label="Wireframe" active={wireframe} onClick={() => setWireframe(!wireframe)} />
        </div>

        <div className="flex-1 relative">
          {!geometry && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none grid-bg"
            >
              <svg width="64" height="64" viewBox="0 0 28 28" fill="none" opacity={0.15}>
                <rect x="1" y="1" width="26" height="26" rx="5" stroke="hsl(185 90% 42%)" strokeWidth="1.5"/>
                <polygon points="7,20 14,8 21,20" stroke="hsl(185 90% 42%)" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
              </svg>
              <p className="text-sm" style={{ color: "hsl(210 10% 40%)" }}>
                Upload an image and click <strong style={{ color: "hsl(185 90% 52%)" }}>Convert to 3D</strong>
              </p>
            </div>
          )}
          <Viewer3D geometry={geometry} wireframe={wireframe} showGrid={showGrid} />
        </div>
      </div>

      {/* Right panel — validation + export */}
      <aside
        className="flex flex-col gap-4 overflow-y-auto p-4"
        style={{
          width: 260,
          flexShrink: 0,
          background: "hsl(220 13% 9%)",
          borderLeft: "1px solid hsl(220 10% 15%)",
        }}
      >
        <Section title="Mesh Validation">
          <ValidationPanel validation={validation} />
        </Section>

        <Section title="Export">
          <ExportPanel geometry={geometry} projectName={projectName} />
        </Section>

        {/* Quick tips */}
        <Section title="Tips">
          <div className="flex flex-col gap-2 text-xs" style={{ color: "hsl(210 10% 45%)" }}>
            <Tip>High-contrast B&W images produce the sharpest heightmaps</Tip>
            <Tip>Use "Invert height" to make dark areas raised</Tip>
            <Tip>Add a base plate for easier bed adhesion</Tip>
            <Tip>Increase resolution for finer detail (slower)</Tip>
            <Tip>Export .3mf to preserve color metadata in Bambu / Prusa</Tip>
          </div>
        </Section>
      </aside>
    </div>
  );
}

function ViewerToggle({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors"
      style={{
        background: active ? "hsl(185 90% 42% / 0.15)" : "transparent",
        color: active ? "hsl(185 90% 52%)" : "hsl(210 10% 50%)",
        border: `1px solid ${active ? "hsl(185 90% 42% / 0.3)" : "transparent"}`,
      }}
      data-testid={`toggle-${label.toLowerCase()}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5">
      <span style={{ color: "hsl(185 90% 42%)", flexShrink: 0, marginTop: 1 }}>→</span>
      {children}
    </p>
  );
}
