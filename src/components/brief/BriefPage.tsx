import { BRIEF_COPY, BRIEF_DEV_ITEMS } from "@/content/brief";

export function BriefPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 p-6 pb-16 text-[14px] text-text">
      <header className="space-y-1">
        <h1 id="page-title" className="text-[24px] font-semibold">
          {BRIEF_COPY.title}
        </h1>
        <p className="text-[13px] text-muted-fg">{BRIEF_COPY.credit}</p>
      </header>

      <section aria-labelledby="brief-problem" className="space-y-2">
        <h2 id="brief-problem" className="text-[16px] font-semibold">
          {BRIEF_COPY.problemHeading}
        </h2>
        <p className="leading-relaxed text-text">{BRIEF_COPY.problem}</p>
      </section>

      <section aria-labelledby="brief-persona" className="space-y-2">
        <h2 id="brief-persona" className="text-[16px] font-semibold">
          {BRIEF_COPY.personaHeading}
        </h2>
        <p className="font-medium">{BRIEF_COPY.personaName}</p>
        <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-text">
          {BRIEF_COPY.personaBullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="brief-writeup" className="space-y-3">
        <h2 id="brief-writeup" className="text-[16px] font-semibold">
          {BRIEF_COPY.writeupHeading}
        </h2>
        <p className="text-[13px] leading-relaxed text-muted-fg">{BRIEF_COPY.writeupIntro}</p>
        <ol className="list-decimal space-y-2 pl-5 text-[13px] leading-relaxed">
          {BRIEF_COPY.features.map((feature) => (
            <li key={feature.name}>
              <span className="font-medium text-text">{feature.name}.</span>{" "}
              <span className="text-muted-fg">{feature.why}</span>
            </li>
          ))}
        </ol>
        <div className="space-y-1.5">
          <h3 className="text-[14px] font-medium">{BRIEF_COPY.metricsHeading}</h3>
          <ul className="space-y-1.5 text-[13px] leading-relaxed">
            {BRIEF_COPY.metrics.map((metric) => (
              <li key={metric.label}>
                <span className="font-medium">{metric.label}:</span>{" "}
                <span className="text-muted-fg">{metric.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-[12px] text-muted-fg">{BRIEF_COPY.writeupDocHint}</p>
      </section>

      <section aria-labelledby="brief-dev" className="space-y-3">
        <h2 id="brief-dev" className="text-[16px] font-semibold">
          {BRIEF_COPY.devHeading}
        </h2>
        <p className="text-[13px] text-muted-fg">{BRIEF_COPY.devIntro}</p>
        <ol className="list-decimal space-y-3 pl-5 text-[13px] leading-relaxed">
          {BRIEF_DEV_ITEMS.map((item) => (
            <li key={item.title} className="space-y-0.5">
              <div className="font-medium text-text">{item.title}</div>
              <div className="text-muted-fg">Why: {item.why}</div>
              <div className="text-muted-fg">Acceptance: {item.acceptance}</div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="brief-review" className="space-y-2">
        <h2 id="brief-review" className="text-[16px] font-semibold">
          {BRIEF_COPY.reviewHeading}
        </h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed">
          {BRIEF_COPY.reviewSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-border pt-4 text-[13px] text-muted-fg">
        {BRIEF_COPY.credit}
      </footer>
    </article>
  );
}
