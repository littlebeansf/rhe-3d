import { cn } from "@/lib/utils";

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  testId?: string;
}

export function SliderField({ label, value, min, max, step, unit, onChange, testId }: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium" style={{ color: "hsl(210 15% 65%)" }}>{label}</label>
        <span className="text-xs font-mono" style={{ color: "hsl(185 90% 52%)" }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        data-testid={testId}
      />
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}

export function ToggleField({ label, value, onChange, testId }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium" style={{ color: "hsl(210 15% 65%)" }}>{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors focus:outline-none",
          value ? "bg-cyan-500" : "bg-slate-600"
        )}
        style={{ background: value ? "hsl(185 90% 42%)" : "hsl(220 10% 28%)" }}
        data-testid={testId}
      >
        <span
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
            value ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  testId?: string;
}

export function SelectField({ label, value, options, onChange, testId }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "hsl(210 15% 65%)" }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 rounded text-sm focus:outline-none"
        style={{
          background: "hsl(220 12% 14%)",
          border: "1px solid hsl(220 10% 22%)",
          color: "hsl(210 20% 85%)",
        }}
        data-testid={testId}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "hsl(185 90% 42%)", borderBottom: "1px solid hsl(185 90% 42% / 0.2)", paddingBottom: 6 }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
