import type { MeshValidation } from "@/lib/geometry";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

interface ValidationPanelProps {
  validation: MeshValidation | null;
  loading?: boolean;
}

export default function ValidationPanel({ validation, loading }: ValidationPanelProps) {
  if (loading) {
    return (
      <div className="p-3 rounded-md animate-pulse" style={{ background: "hsl(220 12% 13%)" }}>
        <p className="text-xs" style={{ color: "hsl(210 10% 50%)" }}>Validating mesh…</p>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="p-3 rounded-md flex items-center gap-2" style={{ background: "hsl(220 12% 13%)" }}>
        <Info size={14} style={{ color: "hsl(210 10% 50%)" }} />
        <p className="text-xs" style={{ color: "hsl(210 10% 50%)" }}>Convert an image to see mesh validation</p>
      </div>
    );
  }

  const allOk = validation.isManifold && !validation.hasOverhangs && validation.minWallThickness >= 0.8;

  return (
    <div className="flex flex-col gap-2">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Triangles" value={validation.triangles.toLocaleString()} />
        <Stat label="Vertices" value={validation.vertices.toLocaleString()} />
        <Stat
          label="Min Wall"
          value={`${validation.minWallThickness} mm`}
          ok={validation.minWallThickness >= 0.8}
        />
        <Stat
          label="Manifold"
          value={validation.isManifold ? "Yes" : "No"}
          ok={validation.isManifold}
        />
      </div>

      {/* Warnings */}
      {validation.warnings.length === 0 ? (
        <div
          className="flex items-center gap-2 p-2 rounded"
          style={{ background: "hsl(145 60% 30% / 0.15)", border: "1px solid hsl(145 60% 30% / 0.3)" }}
        >
          <CheckCircle size={14} style={{ color: "hsl(145 60% 50%)", flexShrink: 0 }} />
          <p className="text-xs" style={{ color: "hsl(145 60% 60%)" }}>Mesh looks printable</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {validation.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded"
              style={{ background: "hsl(38 95% 55% / 0.08)", border: "1px solid hsl(38 95% 55% / 0.2)" }}
            >
              <AlertTriangle size={13} style={{ color: "hsl(38 95% 55%)", flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs" style={{ color: "hsl(38 95% 70%)" }}>{w}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  const color = ok === undefined
    ? "hsl(210 20% 75%)"
    : ok
    ? "hsl(145 60% 50%)"
    : "hsl(38 95% 55%)";

  return (
    <div
      className="flex flex-col gap-0.5 p-2 rounded"
      style={{ background: "hsl(220 12% 12%)", border: "1px solid hsl(220 10% 18%)" }}
    >
      <span className="text-xs" style={{ color: "hsl(210 10% 45%)" }}>{label}</span>
      <span className="text-xs font-mono font-medium" style={{ color }}>{value}</span>
    </div>
  );
}
