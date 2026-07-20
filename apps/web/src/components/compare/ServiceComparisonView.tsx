import type { ServiceComparison, Tradeoff } from "@cloudarch/shared";

interface ServiceComparisonViewProps {
  alternatives: ServiceComparison[];
  tradeoffs: Tradeoff[];
}

export function ServiceComparisonView({
  alternatives,
  tradeoffs,
}: ServiceComparisonViewProps) {
  return (
    <div className="space-y-8">
      {tradeoffs.map((t) => (
        <div
          key={t.title}
          className="bg-surface border border-outline-variant rounded-2xl p-8"
        >
          <h2 className="font-display text-headline-md text-on-surface mb-4">{t.title}</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-4">
            <div>
              <h3 className="text-label-caps uppercase text-primary mb-2">Pros</h3>
              <ul className="space-y-1">
                {t.pros.map((p) => (
                  <li key={p} className="text-body-sm text-on-surface flex gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">check</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-label-caps uppercase text-error mb-2">Cons</h3>
              <ul className="space-y-1">
                {t.cons.map((c) => (
                  <li key={c} className="text-body-sm text-on-surface flex gap-2">
                    <span className="material-symbols-outlined text-error text-sm">close</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-body-sm bg-primary-container text-on-primary-container rounded-lg p-4">
            <strong>Recommendation:</strong> {t.recommendation}
          </p>
        </div>
      ))}

      {alternatives.map((alt) => (
        <div
          key={alt.id}
          className="bg-surface border border-outline-variant rounded-2xl overflow-hidden"
        >
          <div className="bg-surface-container-high px-8 py-4 border-b border-outline-variant">
            <h2 className="font-display text-headline-md text-on-surface">{alt.title}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-outline-variant">
            {alt.services.map((svc) => (
              <div key={svc.name} className="p-8">
                <h3 className="font-display text-xl text-primary mb-4">{svc.name}</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-label-caps uppercase text-on-surface-variant mb-2">
                      Best for
                    </h4>
                    <p className="text-body-sm">{svc.bestFor}</p>
                  </div>
                  <div>
                    <h4 className="text-label-caps uppercase text-primary mb-2">Pros</h4>
                    <ul className="space-y-1">
                      {svc.pros.map((p) => (
                        <li key={p} className="text-body-sm flex gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">
                            check_circle
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {svc.cons.length > 0 && (
                    <div>
                      <h4 className="text-label-caps uppercase text-error mb-2">Cons</h4>
                      <ul className="space-y-1">
                        {svc.cons.map((c) => (
                          <li key={c} className="text-body-sm flex gap-2">
                            <span className="material-symbols-outlined text-error text-sm">
                              cancel
                            </span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {svc.govcloudNotes && (
                    <p className="text-body-sm text-on-surface-variant italic border-l-2 border-primary pl-3">
                      {svc.govcloudNotes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-8 py-4 bg-primary-container/50 border-t border-outline-variant">
            <p className="text-body-sm">
              <strong>Verdict:</strong> {alt.verdict}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
