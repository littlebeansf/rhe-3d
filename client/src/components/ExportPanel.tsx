import { useState } from "react";
import * as THREE from "three";
import {
  geometryToSTL,
  geometryToOBJ,
  geometryTo3MF,
  geometryToGLB,
} from "@/lib/geometry";
import { downloadBlob, formatBytes } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2 } from "lucide-react";

interface ExportPanelProps {
  geometry: THREE.BufferGeometry | null;
  projectName?: string;
}

const FORMATS = [
  {
    id: "stl",
    label: ".stl",
    desc: "Universal slicer format",
    tags: ["Bambu", "Prusa", "Cura", "Orca"],
    color: "hsl(185 90% 42%)",
  },
  {
    id: "3mf",
    label: ".3mf",
    desc: "Rich format with metadata",
    tags: ["Bambu", "Prusa", "Cura"],
    color: "hsl(258 90% 65%)",
  },
  {
    id: "obj",
    label: ".obj",
    desc: "Standard mesh + UV",
    tags: ["Blender", "Meshlab"],
    color: "hsl(38 95% 55%)",
  },
  {
    id: "glb",
    label: ".glb",
    desc: "Web / AR / game engines",
    tags: ["Unity", "Unreal", "Three.js"],
    color: "hsl(145 60% 50%)",
  },
];

export default function ExportPanel({ geometry, projectName = "rhe3d-model" }: ExportPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async (formatId: string) => {
    if (!geometry) return;
    setLoading(formatId);
    try {
      const name = projectName.replace(/\s+/g, "_").toLowerCase();
      switch (formatId) {
        case "stl": {
          const buf = geometryToSTL(geometry);
          downloadBlob(new Blob([buf], { type: "application/octet-stream" }), `${name}.stl`);
          toast({ title: "STL exported", description: `${formatBytes(buf.byteLength)}` });
          break;
        }
        case "obj": {
          const str = geometryToOBJ(geometry);
          downloadBlob(new Blob([str], { type: "text/plain" }), `${name}.obj`);
          toast({ title: "OBJ exported" });
          break;
        }
        case "3mf": {
          const blob = await geometryTo3MF(geometry);
          downloadBlob(blob, `${name}.3mf`);
          toast({ title: "3MF exported", description: `${formatBytes(blob.size)}` });
          break;
        }
        case "glb": {
          const buf = await geometryToGLB(geometry);
          downloadBlob(new Blob([buf], { type: "model/gltf-binary" }), `${name}.glb`);
          toast({ title: "GLB exported", description: `${formatBytes(buf.byteLength)}` });
          break;
        }
      }
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {FORMATS.map((fmt) => (
        <button
          key={fmt.id}
          disabled={!geometry || loading === fmt.id}
          onClick={() => handleExport(fmt.id)}
          className="flex flex-col items-start gap-1 p-3 rounded-md text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "hsl(220 12% 12%)",
            border: `1px solid ${!geometry ? "hsl(220 10% 18%)" : fmt.color + "44"}`,
          }}
          data-testid={`button-export-${fmt.id}`}
        >
          <div className="flex items-center gap-1.5 w-full">
            <span className="font-mono font-semibold text-sm" style={{ color: fmt.color }}>
              {fmt.label}
            </span>
            {loading === fmt.id && <Loader2 size={12} className="animate-spin ml-auto" style={{ color: fmt.color }} />}
            {loading !== fmt.id && geometry && <Download size={12} className="ml-auto opacity-50" />}
          </div>
          <p className="text-xs" style={{ color: "hsl(210 10% 50%)" }}>{fmt.desc}</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {fmt.tags.map((t) => (
              <span
                key={t}
                className="text-xs px-1 py-0.5 rounded"
                style={{ background: fmt.color + "18", color: fmt.color + "cc", fontSize: 10 }}
              >
                {t}
              </span>
            ))}
          </div>
        </button>
      ))}

      {/* STEP roadmap */}
      <button
        disabled
        className="col-span-2 flex items-center gap-2 p-2.5 rounded-md text-left opacity-50 cursor-not-allowed"
        style={{ background: "hsl(220 12% 12%)", border: "1px dashed hsl(220 10% 22%)" }}
      >
        <span className="font-mono font-medium text-xs" style={{ color: "hsl(210 10% 50%)" }}>.step</span>
        <span className="text-xs" style={{ color: "hsl(210 10% 40%)" }}>STEP / ISO 10303 — Engineering CAD</span>
        <span
          className="ml-auto text-xs px-1.5 py-0.5 rounded"
          style={{ background: "hsl(258 60% 40% / 0.3)", color: "hsl(258 90% 70%)" }}
        >
          Roadmap
        </span>
      </button>
    </div>
  );
}
