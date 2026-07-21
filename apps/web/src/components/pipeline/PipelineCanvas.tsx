"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import type { ArchitectureProposal, ServiceNode } from "@cloudarch/shared";
import { AwsServiceNode, type AwsServiceNodeData } from "@/components/pipeline/AwsServiceNode";
import { NodeHoverTooltip } from "@/components/pipeline/NodeHoverTooltip";
import { PipelineLayerBands } from "@/components/pipeline/PipelineLayerBands";

const nodeTypes = { awsService: AwsServiceNode };

const SKELETON_LAYERS = [
  { id: "sk-net", category: "Networking", y: 40 },
  { id: "sk-comp", category: "Compute", y: 180 },
  { id: "sk-store", category: "Storage", y: 420 },
  { id: "sk-sec", category: "Security", y: 580 },
];

function toFlowNodes(
  services: ServiceNode[],
  revealCount: number,
  onHover: AwsServiceNodeData["onHover"]
): Node[] {
  return services.map((s, index) => ({
    id: s.id,
    type: "awsService",
    position: s.position,
    data: {
      service: s,
      visible: index < revealCount,
      onHover,
    } satisfies AwsServiceNodeData,
  }));
}

function toFlowEdges(
  connections: ArchitectureProposal["connections"],
  revealCount: number
): Edge[] {
  return connections.map((c, i) => ({
    id: c.id,
    source: c.source,
    target: c.target,
    label: c.label,
    animated: (c.animated ?? true) && i < revealCount,
    style: {
      stroke: i < revealCount ? "#64748b" : "#e5e5e5",
      strokeWidth: 1.5,
      opacity: i < revealCount ? 1 : 0.2,
    },
    labelStyle: { fontSize: 10, fill: "#64748b" },
  }));
}

interface PipelineCanvasProps {
  projectId: string;
  architecture?: ArchitectureProposal;
  generating?: boolean;
}

export function PipelineCanvas({
  projectId,
  architecture,
  generating = false,
}: PipelineCanvasProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [revealCount, setRevealCount] = useState(0);
  const [selectedNode, setSelectedNode] = useState<ServiceNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ServiceNode | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | undefined>();

  const handleHover = useCallback<NonNullable<AwsServiceNodeData["onHover"]>>(
    (service, rect) => {
      setHoveredNode(service);
      setHoverRect(rect);
    },
    []
  );

  useEffect(() => {
    if (!architecture || generating) {
      setRevealCount(0);
      setNodes([]);
      setEdges([]);
      return;
    }

    setRevealCount(0);
    const interval = setInterval(() => {
      setRevealCount((prev) => {
        if (prev >= architecture.services.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 350);

    return () => clearInterval(interval);
  }, [architecture, generating, setNodes, setEdges]);

  useEffect(() => {
    if (architecture && !generating) {
      setNodes(toFlowNodes(architecture.services, revealCount, handleHover));
      setEdges(toFlowEdges(architecture.connections, revealCount));
    }
  }, [architecture, generating, revealCount, handleHover, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as unknown as AwsServiceNodeData;
      if (data.service) setSelectedNode(data.service);
    },
    []
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      router.push(`/projects/${projectId}/services/${node.id}`);
    },
    [projectId, router]
  );

  const flowProps = useMemo(
    () => ({
      nodeTypes,
      fitView: true as const,
      fitViewOptions: { padding: 0.2 },
      proOptions: { hideAttribution: true as const },
    }),
    []
  );

  if (generating) {
    return (
      <div className="flex-1 flex flex-col min-h-0 m-4">
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
          <h2 className="text-sm font-semibold text-foreground">Illustrating architecture…</h2>
        </div>
        <div className="flex-1 rounded-xl border border-border overflow-hidden bg-card min-h-[320px] relative">
          <PipelineLayerBands />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md px-8 z-10">
              <div className="flex justify-center gap-3 mb-6">
                {["Retrieve", "Analyze", "Design", "Layout"].map((step, i) => (
                  <div key={step} className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center text-xs font-bold text-accent animate-pulse-soft"
                      style={{ animationDelay: `${i * 0.3}s` }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-[10px] text-muted">{step}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted leading-relaxed">
                OpenSearch RAG + GPT OSS 120B is designing your GovCloud backend pipeline…
              </p>
            </div>
          </div>
          {SKELETON_LAYERS.map((layer) => (
            <div
              key={layer.id}
              className="absolute left-1/2 -translate-x-1/2 w-36 h-14 rounded-xl border-2 border-dashed border-border/60 animate-pulse-soft"
              style={{ top: layer.y }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!architecture) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background border border-border rounded-xl m-4">
        <div className="text-center max-w-sm px-6">
          <div className="w-12 h-12 rounded-full bg-accent-muted flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Pipeline will appear here</p>
          <p className="text-xs text-muted leading-relaxed">
            Send a prompt in the chat. OpenSearch RAG + GPT OSS 120B will illustrate your GovCloud
            backend architecture.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 m-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Architecture pipeline</h2>
          <p className="text-xs text-muted mt-0.5">
            Hover for pricing & scalability · click to pin · double-click for details
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent-muted text-accent">
            {architecture.compliance.framework}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-background border border-border text-muted">
            {architecture.services.length} services
          </span>
        </div>
      </div>

      <div className="flex flex-1 gap-3 min-h-0">
        <div className="flex-1 rounded-xl border border-border overflow-hidden bg-card min-h-[320px] relative">
          <PipelineLayerBands />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            {...flowProps}
            className="relative z-10"
          >
            <Background gap={20} color="#e5e5e5" />
            <Controls showInteractive={false} className="!shadow-soft !border-border" />
          </ReactFlow>
          <NodeHoverTooltip service={hoveredNode} anchorRect={hoverRect} />
        </div>

        {selectedNode && (
          <div className="w-72 flex-shrink-0 rounded-xl border border-border bg-card p-4 overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">{selectedNode.data.category}</p>
                <h3 className="text-sm font-semibold text-foreground">{selectedNode.data.label}</h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-muted hover:text-foreground text-lg leading-none"
              >
                ×
              </button>
            </div>
            {selectedNode.data.monthlyCostLow != null && (
              <p className="text-xs text-muted mb-2">
                Cost: ${selectedNode.data.monthlyCostLow.toFixed(0)}–$
                {(selectedNode.data.monthlyCostHigh ?? 0).toFixed(0)}/mo
              </p>
            )}
            {selectedNode.data.aiRecommendation && (
              <div className="mb-3 rounded-lg bg-accent-muted/50 p-3">
                <p className="text-[10px] font-bold text-accent uppercase mb-1">AI recommendation</p>
                <p className="text-xs text-foreground leading-relaxed">
                  {selectedNode.data.aiRecommendation}
                </p>
              </div>
            )}
            <button
              onClick={() => router.push(`/projects/${projectId}/services/${selectedNode.id}`)}
              className="w-full text-xs font-medium text-accent hover:underline"
            >
              View full analytics →
            </button>
          </div>
        )}
      </div>

      {architecture.ragInsights && architecture.ragInsights.length > 0 && (
        <div className="mt-3 rounded-lg border border-border bg-card px-3 py-2">
          <p className="text-[10px] font-bold text-accent uppercase mb-1">OpenSearch RAG insights</p>
          <p className="text-xs text-muted truncate">{architecture.ragInsights[0]}</p>
        </div>
      )}

      <p className="text-xs text-muted mt-2 px-1 truncate">{architecture.summary}</p>
    </div>
  );
}
