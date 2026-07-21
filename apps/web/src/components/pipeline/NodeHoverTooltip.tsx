"use client";

import { createPortal } from "react-dom";
import type { ServiceNode } from "@cloudarch/shared";

interface NodeHoverTooltipProps {
  service: ServiceNode | null;
  anchorRect?: DOMRect;
}

export function NodeHoverTooltip({ service, anchorRect }: NodeHoverTooltipProps) {
  if (!service || !anchorRect || typeof document === "undefined") {
    return null;
  }

  const top = anchorRect.bottom + 8;
  const left = Math.min(anchorRect.left, window.innerWidth - 280);

  const costLow = service.data.monthlyCostLow;
  const costHigh = service.data.monthlyCostHigh;

  return createPortal(
    <div
      className="fixed z-[9999] w-64 rounded-xl border border-border bg-card shadow-panel p-4 pointer-events-none"
      style={{ top, left }}
    >
      <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">
        {service.data.category}
      </p>
      <h4 className="text-sm font-semibold text-foreground mb-2">{service.data.label}</h4>

      {service.data.description && (
        <p className="text-xs text-muted leading-relaxed mb-3">{service.data.description}</p>
      )}

      {(costLow != null || costHigh != null) && (
        <div className="mb-3 rounded-lg bg-background border border-border px-3 py-2">
          <p className="text-[10px] text-muted uppercase mb-0.5">Monthly cost (est.)</p>
          <p className="text-sm font-semibold text-foreground">
            ${(costLow ?? 0).toFixed(0)} – ${(costHigh ?? 0).toFixed(0)}
          </p>
        </div>
      )}

      {service.data.scalabilityLabel && (
        <div className="mb-3 rounded-lg bg-background border border-border px-3 py-2">
          <p className="text-[10px] text-muted uppercase mb-0.5">Scalability</p>
          <p className="text-xs font-medium text-foreground">{service.data.scalabilityLabel}</p>
          {service.data.scalabilityDetail && (
            <p className="text-[10px] text-muted mt-1 leading-relaxed">
              {service.data.scalabilityDetail}
            </p>
          )}
        </div>
      )}

      {service.data.aiRecommendation && (
        <div className="rounded-lg bg-accent-muted/40 px-3 py-2">
          <p className="text-[10px] font-bold text-accent uppercase mb-0.5">AI recommendation</p>
          <p className="text-[11px] text-foreground leading-relaxed line-clamp-4">
            {service.data.aiRecommendation}
          </p>
        </div>
      )}
    </div>,
    document.body
  );
}
