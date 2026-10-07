import { Link } from "react-router-dom";

import { Button } from "@/components/ui";
import { briefCopy } from "@/content/supporting";
import { formatDemoClock } from "@/lib/time";

export function BriefPage() {
  return (
    <div
      className="h-full overflow-auto px-6 py-6 text-text"
      data-testid="page-brief"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header>
          <h1 className="text-xl font-medium tracking-tight">{briefCopy.title}</h1>
          <p className="mt-1 text-sm text-text-muted">{briefCopy.subtitle}</p>
          <p className="mt-2 font-mono text-xs text-text-faint" data-testid="seeded-summary">
            Demo clock: {formatDemoClock("IST")}
          </p>
        </header>

        <section
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-5"
          data-testid="brief-problem"
        >
          <h2 className="text-base font-medium">{briefCopy.problemTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">{briefCopy.problem}</p>
        </section>

        <section
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-5"
          data-testid="brief-persona"
        >
          <h2 className="text-base font-medium">{briefCopy.personaTitle}</h2>
          <p className="mt-2 text-sm text-accent">{briefCopy.personaName}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-muted">
            {briefCopy.personaBullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-5"
          data-testid="brief-playbook"
        >
          <h2 className="text-base font-medium">{briefCopy.playbookTitle}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-text-muted">
            {briefCopy.playbookSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-5"
          data-testid="brief-cases"
        >
          <h2 className="text-base font-medium">{briefCopy.casesTitle}</h2>
          <ul className="mt-3 space-y-3">
            {briefCopy.cases.map((c) => (
              <li
                key={c.id}
                className="rounded-[var(--radius-control)] border border-border bg-surface-2 p-3"
              >
                <Link
                  to={`/tickets/${c.id}`}
                  className="font-mono text-sm text-accent"
                  data-testid={`brief-case-${c.id}`}
                >
                  {c.id}
                </Link>
                <p className="mt-1 text-sm text-text">{c.title}</p>
                <p className="mt-1 text-xs text-text-muted">{c.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="brief-writeup"
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-5"
          data-testid="brief-writeup"
        >
          <h2 className="text-base font-medium">{briefCopy.writeupTitle}</h2>
          <p className="mt-2 text-sm text-text-muted">{briefCopy.writeupIntro}</p>
          <ul className="mt-3 space-y-2">
            {briefCopy.writeupLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-accent hover:underline"
                  data-testid={`brief-link-${link.note.replaceAll("/", "-")}`}
                >
                  {link.label}
                </a>
                <span className="ml-2 font-mono text-xs text-text-faint">{link.note}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-5 text-sm font-medium text-text">{briefCopy.writeupBodyTitle}</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-text-muted">
            {briefCopy.writeupFeatures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ol>
        </section>

        <section
          id="brief-dev-items"
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-5"
          data-testid="brief-dev-items"
        >
          <h2 className="text-base font-medium">{briefCopy.devItemsTitle}</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-text-muted">
            {briefCopy.devItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-5"
          data-testid="brief-review"
        >
          <h2 className="text-base font-medium">{briefCopy.reviewTitle}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-text-muted">
            {briefCopy.reviewSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/tickets/TKT-24817">Open TKT-24817</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to="/tickets/TKT-24823">Open TKT-24823</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/home">Home</Link>
            </Button>
          </div>
        </section>

        <section
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-5"
          data-testid="brief-credits"
        >
          <h2 className="text-base font-medium">{briefCopy.creditsTitle}</h2>
          <p className="mt-3 text-lg text-text" data-testid="brief-built-by">
            {briefCopy.credits}
          </p>
        </section>
      </div>
    </div>
  );
}
