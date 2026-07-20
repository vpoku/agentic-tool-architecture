"use client";

interface BackendVisualizerProps {
  serviceName: string;
}

const FLOWS: Record<string, { steps: string[]; color: string }> = {
  "Amazon S3": {
    steps: ["Upload request", "KMS encrypt", "Store object", "Return key"],
    color: "#c2652a",
  },
  "AWS Lambda": {
    steps: ["Trigger event", "Load code", "Execute handler", "Return response"],
    color: "#7a5941",
  },
  "Amazon API Gateway": {
    steps: ["HTTPS request", "Auth check", "Route to backend", "Response"],
    color: "#5a623a",
  },
  "Amazon DynamoDB": {
    steps: ["Write request", "Partition key", "Replicate AZs", "Confirm"],
    color: "#c2652a",
  },
  "Amazon SQS": {
    steps: ["Send message", "Queue store", "Poll worker", "Delete on success"],
    color: "#7a5941",
  },
  "AWS KMS": {
    steps: ["Key request", "HSM encrypt", "Ciphertext", "Audit log"],
    color: "#5a623a",
  },
  "Amazon CloudWatch": {
    steps: ["Log event", "Ingest", "Index", "Query/Alarm"],
    color: "#c2652a",
  },
};

export function BackendVisualizer({ serviceName }: BackendVisualizerProps) {
  const flow = FLOWS[serviceName] ?? {
    steps: ["Request", "Process", "Store", "Respond"],
    color: "#c2652a",
  };

  return (
    <div className="bg-surface-container rounded-xl p-4 border border-outline-variant">
      <h4 className="text-label-caps uppercase text-on-surface-variant mb-4">
        Data flow
      </h4>
      <div className="flex items-center justify-between gap-1">
        {flow.steps.map((step, i) => (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div
              className="rounded-lg px-2 py-2 text-[10px] font-bold text-center text-white flex-shrink-0 w-full"
              style={{ backgroundColor: flow.color, opacity: 0.85 + i * 0.03 }}
            >
              {step}
            </div>
            {i < flow.steps.length - 1 && (
              <span className="material-symbols-outlined text-primary text-sm flex-shrink-0 mx-0.5">
                arrow_forward
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
