"use client";

import { useCallback, useEffect } from "react";
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

function toFlowNodes(services: ServiceNode[]): Node[] {
  return services.map((s) => ({
    id: s.id,
    type: "default",
    position: s.position,
    data: {
      label: (
        <div className="text-center px-1 py-0.5 cursor-pointer">
          <div className="text-xs font-semibold text-foreground">{s.data.label}</div>
          <div className="text-[10px] text-muted mt-0.5">{s.data.category}</div>
        </div>
      ),
    },
    style: {
      background: "#ffffff",
      border: "1.5px solid #2563eb",
      borderRadius: "10px",
      padding: "10px 8px",
      minWidth: 130,
      boxShadow: "0 1px 3px rgb(0 0 0 / 0.08)",
    },
  }));
}

function toFlowEdges(connections: ArchitectureProposal["connections"]): Edge[] {
  return connections.map((c) => ({
    id: c.id,
    source: c.source,
    target: c.target,
    label: c.label,
    animated: c.animated ?? true,
    style: { stroke: "#94a3b8", strokeWidth: 1.5 },
    labelStyle: { fontSize: 10, fill: "#64748b" },
  }));
}

interface PipelineCanvasProps {
  projectId: string;
  architecture?: ArchitectureProposal;
}

export function PipelineCanvas({ projectId, architecture }: PipelineCanvasProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (architecture) {
      setNodes(toFlowNodes(architecture.services));
      setEdges(toFlowEdges(architecture.connections));
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [architecture, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      router.push(`/projects/${projectId}/services/${node.id}`);
    },
    [projectId, router]
  );

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
            Describe your project in the chat. CloudArch will sketch the AWS GovCloud architecture
            as you go.
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
            Click any component for details, pricing, and recommendations
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

      <div className="flex-1 rounded-xl border border-border overflow-hidden bg-card min-h-[320px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} color="#e5e5e5" />
          <Controls showInteractive={false} className="!shadow-soft !border-border" />
        </ReactFlow>
      </div>

      <p className="text-xs text-muted mt-2 px-1 truncate">{architecture.summary}</p>
    </div>
  );
}
