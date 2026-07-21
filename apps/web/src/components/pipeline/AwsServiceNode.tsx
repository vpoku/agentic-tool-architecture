"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { ServiceNode } from "@cloudarch/shared";

const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  Networking: { border: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  Compute: { border: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9" },
  Storage: { border: "#f59e0b", bg: "#fffbeb", text: "#b45309" },
  Database: { border: "#10b981", bg: "#ecfdf5", text: "#047857" },
  Integration: { border: "#6366f1", bg: "#eef2ff", text: "#4338ca" },
  Security: { border: "#ef4444", bg: "#fef2f2", text: "#b91c1c" },
  Management: { border: "#64748b", bg: "#f8fafc", text: "#475569" },
};

export function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Management;
}

export interface AwsServiceNodeData {
  service: ServiceNode;
  visible: boolean;
  onHover?: (service: ServiceNode | null, rect?: DOMRect) => void;
}

function AwsServiceNodeComponent(props: NodeProps) {
  const { data, selected } = props;
  const { service, visible, onHover } = data as unknown as AwsServiceNodeData;
  const style = getCategoryStyle(service.data.category);

  return (
    <div
      className={`transition-all duration-500 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      onMouseEnter={(e) => {
        onHover?.(service, e.currentTarget.getBoundingClientRect());
      }}
      onMouseLeave={() => onHover?.(null)}
      style={{
        background: style.bg,
        border: `2px solid ${selected ? "#2563eb" : style.border}`,
        borderRadius: 12,
        padding: "10px 12px",
        minWidth: 148,
        boxShadow: selected
          ? "0 4px 16px rgb(37 99 235 / 0.2)"
          : "0 2px 8px rgb(0 0 0 / 0.06)",
        cursor: "pointer",
      }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-wide mb-1"
        style={{ color: style.text }}
      >
        {service.data.category}
      </div>
      <div className="text-xs font-semibold text-foreground">{service.data.label}</div>
      {service.data.scalabilityRating && (
        <div className="mt-1.5 flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor:
                service.data.scalabilityRating === "high"
                  ? "#16a34a"
                  : service.data.scalabilityRating === "medium"
                    ? "#ca8a04"
                    : "#dc2626",
            }}
          />
          <span className="text-[9px] text-muted capitalize">{service.data.scalabilityRating} scale</span>
        </div>
      )}
    </div>
  );
}

export const AwsServiceNode = memo(AwsServiceNodeComponent);
