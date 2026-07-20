"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import type { ArchitectureProposal, ServiceNode } from "@cloudarch/shared";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ServiceDetailPanel } from "@/components/learning/ServiceDetailPanel";

function toFlowNodes(services: ServiceNode[]): Node[] {
  return services.map((s) => ({
    id: s.id,
    type: "default",
    position: s.position,
    data: {
      label: (
        <div className="text-center px-2">
          <div className="font-bold text-xs text-primary">{s.data.label}</div>
          <div className="text-[10px] text-on-surface-variant">{s.data.category}</div>
        </div>
      ),
    },
    style: {
      background: "#fdfbf8",
      border: "2px solid #c2652a",
      borderRadius: "12px",
      padding: "8px",
      minWidth: 120,
    },
  }));
}

function toFlowEdges(
  connections: ArchitectureProposal["connections"]
): Edge[] {
  return connections.map((c) => ({
    id: c.id,
    source: c.source,
    target: c.target,
    label: c.label,
    animated: c.animated ?? false,
    style: { stroke: "#7a5941" },
  }));
}

interface ArchitectureCanvasProps {
  projectId: string;
  architecture?: ArchitectureProposal;
}

export function ArchitectureCanvas({ projectId, architecture }: ArchitectureCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedService, setSelectedService] = useState<ServiceNode | null>(null);

  useEffect(() => {
    if (architecture) {
      setNodes(toFlowNodes(architecture.services));
      setEdges(toFlowEdges(architecture.connections));
    }
  }, [architecture, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const svc = architecture?.services.find((s) => s.id === node.id);
      if (svc) setSelectedService(svc);
    },
    [architecture]
  );

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <div className="flex-grow relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          className="bg-surface-container-low"
        >
          <Background gap={24} color="#d5c9c1" />
          <Controls />
          <MiniMap nodeColor="#c2652a" />
        </ReactFlow>

        {architecture && (
          <div className="absolute top-4 left-4 glass-panel border border-outline-variant rounded-xl p-4 max-w-md z-10">
            <h3 className="font-display text-headline-md text-on-surface mb-2">
              Architecture Summary
            </h3>
            <p className="text-body-sm text-on-surface-variant">{architecture.summary}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">
                {architecture.compliance.framework}
              </span>
              <span className="px-2 py-0.5 rounded bg-secondary-container text-secondary text-[10px] font-bold uppercase">
                {architecture.services.length} services
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="w-[360px] border-l border-outline-variant flex flex-col bg-surface">
        {selectedService ? (
          <ServiceDetailPanel
            service={selectedService}
            onClose={() => setSelectedService(null)}
          />
        ) : (
          <ChatPanel projectId={projectId} />
        )}
      </div>
    </div>
  );
}
