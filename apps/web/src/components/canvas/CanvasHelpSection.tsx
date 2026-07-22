import Link from "next/link";

const CARDS = [
  {
    title: "Azure → AWS Migration",
    description: "Learn how to map Azure services to AWS GovCloud equivalents.",
    href: "/migration",
    cta: "Open Migration",
  },
  {
    title: "Architecture portfolio",
    description: "Every architecture you design is saved in your project sidebar.",
    href: "/app",
    cta: "Start building",
  },
  {
    title: "GovCloud focus",
    description: "FedRAMP-aligned patterns, cost estimates, and service rationales.",
    href: "/app",
    cta: "Generate diagram",
  },
];

export function CanvasHelpSection() {
  return (
    <section className="border-t border-border px-6 py-8 bg-background">
      <h2 className="text-sm font-semibold text-foreground mb-1">Need help getting started?</h2>
      <p className="text-xs text-muted mb-6">
        Resources to design and understand real AWS GovCloud architectures.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {CARDS.map((card) => (
          <div key={card.title} className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">{card.title}</h3>
            <p className="text-xs text-muted leading-relaxed mb-4">{card.description}</p>
            <Link
              href={card.href}
              className="text-xs font-medium text-accent hover:underline"
            >
              {card.cta} →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
