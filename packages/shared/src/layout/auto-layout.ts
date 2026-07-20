import type { ServiceNode } from "../schemas/architecture.js";

const LAYER_Y: Record<string, number> = {
  Networking: 0,
  Compute: 140,
  Integration: 280,
  Storage: 420,
  Database: 420,
  Security: 560,
  Management: 700,
};

const DEFAULT_Y = 350;

/** Assign grid positions by category layer for pipeline visualization. */
export function autoLayoutServices(services: ServiceNode[]): ServiceNode[] {
  const layerCounts: Record<string, number> = {};

  return services.map((node) => {
    const category = node.data.category;
    const y = LAYER_Y[category] ?? DEFAULT_Y;
    const index = layerCounts[category] ?? 0;
    layerCounts[category] = index + 1;

    const nodesInLayer = services.filter((s) => s.data.category === category).length;
    const xSpread = Math.max(200, nodesInLayer * 180);
    const xStart = 400 - xSpread / 2 + index * 180;

    return {
      ...node,
      position: { x: xStart, y },
    };
  });
}
