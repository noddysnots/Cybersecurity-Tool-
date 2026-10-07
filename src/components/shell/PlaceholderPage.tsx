interface PlaceholderPageProps {
  title: string;
  body: string;
}

export function PlaceholderPage({ title, body }: PlaceholderPageProps) {
  return (
    <section aria-labelledby="page-title">
      <h1 id="page-title" className="text-[20px] font-semibold text-text">
        {title}
      </h1>
      <p className="mt-2 text-[13px] text-muted-fg">{body}</p>
    </section>
  );
}
