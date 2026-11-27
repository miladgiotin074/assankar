export function SectionHeading({
  id,
  kicker,
  title,
  copy,
  light = false,
}: {
  id: string;
  kicker: string;
  title: string;
  copy?: string;
  light?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <p className={light ? "kicker kicker-light" : "kicker"}>{kicker}</p>
      <h2 id={id} className={`title mt-3 ${light ? "text-cream" : "text-ink"}`}>
        {title}
      </h2>
      {copy ? <p className={`copy mt-4 ${light ? "text-foam/90" : "text-muted"}`}>{copy}</p> : null}
    </div>
  );
}
