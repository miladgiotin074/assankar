import { handoverPoints, wageNote } from "@/lib/site";
import { faNum } from "@/lib/format";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

export function Handover() {
  return (
    <section id="tahvil" className="pt-8 pb-12 lg:pt-12 lg:pb-20" aria-labelledby="handover-title">
      <div className="wrap">
        <Reveal>
          <SectionHeading
            id="handover-title"
            kicker="مسیر کالا"
            title="نحوه دریافت و تحویل محصولات"
            copy="کالا را خودتان انتخاب می‌کنید. شرکت آن را به درب منزل می‌رساند و پس از آماده‌سازی، برای دریافت هماهنگ می‌کند."
          />
        </Reveal>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-10">
          {handoverPoints.map((item, index) => (
            <li key={item.title} className="h-full">
              <Reveal delay={index * 70} className="h-full">
                <article className="panel lift h-full p-5 sm:p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-paper-deep text-sm font-extrabold text-pine">
                    {faNum(index + 1)}
                  </span>
                  <h3 className="mt-4 text-lg font-extrabold leading-8">{item.title}</h3>
                  <p className="mt-2 text-base leading-8 text-muted">{item.text}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
        <Reveal delay={80} className="mt-4">
          <article className="panel border-s-4 border-s-wax p-5 sm:p-6">
            <p className="text-sm font-extrabold text-wax">نکته مهم</p>
            <p className="mt-2 text-lg font-extrabold leading-8">{wageNote}</p>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
