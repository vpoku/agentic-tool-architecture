"use client";

const LAYERS = [
  { label: "Networking", y: 0, height: 120 },
  { label: "Compute", y: 120, height: 140 },
  { label: "Integration", y: 260, height: 120 },
  { label: "Storage & Database", y: 380, height: 140 },
  { label: "Security & Ops", y: 520, height: 200 },
];

export function PipelineLayerBands() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {LAYERS.map((layer) => (
        <div
          key={layer.label}
          className="absolute left-0 right-0 border-b border-border/40"
          style={{
            top: layer.y,
            height: layer.height,
            background: "linear-gradient(90deg, rgba(248,250,252,0.6) 0%, transparent 100%)",
          }}
        >
          <span className="absolute left-3 top-2 text-[10px] font-medium text-muted/60 uppercase tracking-wider">
            {layer.label}
          </span>
        </div>
      ))}
    </div>
  );
}
