import { audienceAll, audiences } from "@/lib/site";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

const icons = [ClockIcon, BookIcon, HomeIcon, SunIcon];

export function Audience() {
  return (
    <section id="monaseb" className="wash pt-8 pb-12 lg:pt-12 lg:pb-20" aria-labelledby="audience-title">
      <div className="wrap">
        <Reveal>
          <SectionHeading
            id="audience-title"
            kicker="مخاطب همکاری"
            title="این کار مناسب چه کسانی است؟"
            copy="بسته‌بندی در منزل برای کسی است که می‌خواهد در خانه و با زمان خودش کار کند."
          />
        </Reveal>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-10">
          {audiences.map((item, index) => {
            const Icon = icons[index] ?? ClockIcon;
            return (
              <li key={item.title} className="h-full">
                <Reveal delay={index * 70} className="h-full">
                  <article className="panel lift group h-full p-5 sm:p-6">
                    <span className="chip">
                      <Icon />
                    </span>
                    <h3 className="mt-4 text-lg font-extrabold leading-8">{item.title}</h3>
                    <p className="mt-2 text-base leading-8 text-muted">{item.text}</p>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
        <Reveal delay={80} className="mt-4">
          <article className="panel lift border-s-4 border-s-wax p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-wax text-white">
                <CheckIcon />
              </span>
              <div>
                <h3 className="text-lg font-extrabold leading-8">{audienceAll.title}</h3>
                <p className="mt-2 text-base leading-8 text-muted">{audienceAll.text}</p>
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <circle cx="12" cy="12" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8.5V12l2.4 1.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <path d="M6 6.5h5.2A2.8 2.8 0 0 1 14 9.3V18H8.2A2.2 2.2 0 0 0 6 20.2V6.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M18 6.5h-5.2A2.8 2.8 0 0 0 10 9.3V18h5.8A2.2 2.2 0 0 1 18 20.2V6.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <path d="M5 11.2 12 5.5l7 5.7V19a1 1 0 0 1-1 1h-4.2v-4.6H10.2V20H6a1 1 0 0 1-1-1v-7.8Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4.5v1.8M12 17.7v1.8M4.5 12h1.8M17.7 12h1.8M6.7 6.7l1.3 1.3M16 16l1.3 1.3M17.3 6.7 16 8M8 16l-1.3 1.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <path d="M6.5 12.5 10 16l7.5-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
