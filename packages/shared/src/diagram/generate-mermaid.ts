import type { ArchitectureProposal } from "../schemas/architecture.js";

function sanitizeId(label: string): string {
  return label.replace(/[^a-zA-Z0-9]/g, "_");
}

export function generateMermaidDiagram(architecture: ArchitectureProposal): string {
  const lines = ["graph TD"];
  for (const edge of architecture.connections) {
    const source = architecture.services.find((s) => s.id === edge.source);
    const target = architecture.services.find((s) => s.id === edge.target);
    if (!source || !target) continue;
    const from = sanitizeId(source.data.label);
    const to = sanitizeId(target.data.label);
    const label = edge.label ? `|${edge.label}|` : "";
    lines.push(`  ${from}${label} --> ${to}`);
  }
  for (const svc of architecture.services) {
    const id = sanitizeId(svc.data.label);
    lines.push(`  ${id}["${svc.data.label}"]`);
  }
  return lines.join("\n");
}
