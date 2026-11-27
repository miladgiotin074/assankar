import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

export function Quality() {
  return (
    <section id="keyfiat" className="py-12 lg:py-20" aria-labelledby="quality-title">
      <div className="wrap grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
        <Reveal>
          <SectionHeading
            id="quality-title"
            kicker="دقت کار"
            title="کیفیت انجام کار"
            copy="کیفیت کار مهم‌تر از سرعت انجام آن است. بسته‌ها را با حوصله و طبق فیلم آموزشی همان محصول آماده کنید."
          />
        </Reveal>
        <Reveal delay={80} className="h-full">
          <article className="panel lift flex h-full flex-col justify-center border-s-4 border-s-wax p-5 sm:p-6">
            <p className="text-sm font-extrabold text-wax">پس از یک ماه</p>
            <h3 className="mt-2 text-lg font-extrabold leading-8">بیمه همکاری باکیفیت</h3>
            <p className="mt-2 text-base leading-8 text-muted">
              افرادی که محصولات را با دقت و کیفیت مناسب آماده کنند، پس از یک ماه همکاری توسط شرکت بیمه
              می‌شوند.
            </p>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
