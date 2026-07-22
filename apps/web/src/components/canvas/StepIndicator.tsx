"use client";

export type BuilderStep = "describe" | "thinking" | "review";

interface StepConfig {
  id: BuilderStep;
  num: number;
  label: string;
  hint: string;
}

const DEFAULT_STEPS: StepConfig[] = [
  { id: "describe", num: 1, label: "Describe", hint: "Tell CloudArch what you need" },
  { id: "thinking", num: 2, label: "Thinking", hint: "CloudArch is analyzing your idea" },
  { id: "review", num: 3, label: "Review", hint: "Explore costs, metrics, and rationale" },
];

interface StepIndicatorProps {
  step: BuilderStep;
  steps?: StepConfig[];
}

export function StepIndicator({ step, steps = DEFAULT_STEPS }: StepIndicatorProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-8 px-6 py-4 border-b border-border bg-card">
      {steps.map((s) => {
        const active = step === s.id;
        const done =
          (step === "thinking" && s.id === "describe") ||
          (step === "review" && (s.id === "describe" || s.id === "thinking"));
        return (
          <div key={s.id} className="flex items-center gap-2.5">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                active
                  ? "border-accent bg-accent text-white"
                  : done
                    ? "border-accent bg-accent-muted text-accent"
                    : "border-border text-muted"
              }`}
            >
              {s.num}
            </span>
            <div>
              <p className={`text-sm font-medium ${active ? "text-foreground" : "text-muted"}`}>
                {s.label}
              </p>
              <p className="text-[10px] text-muted hidden sm:block">{s.hint}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const MIGRATION_STEPS: StepConfig[] = [
  { id: "describe", num: 1, label: "Describe", hint: "Paste your Azure architecture" },
  { id: "thinking", num: 2, label: "Thinking", hint: "Mapping Azure to AWS GovCloud" },
  { id: "review", num: 3, label: "Review", hint: "Migration plan, cost, and metrics" },
];
