import { site } from "@/lib/site";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

const pillars = [
  { title: "انتخاب با شما", text: "کالا را خود همکار برمی‌گزیند، از ۱ تا ۳ قلم." },
  { title: "آموزش همراه کالا", text: "فیلم بسته‌بندی صحیح با همان محموله به درب منزل می‌رسد." },
  { title: "دستمزد روشن", text: "پیش از سپردن محصول به تیم جمع‌آوری پرداخت می‌شود." },
];

export function Support() {
  return (
    <section id="poshtibani" className="wash py-12 lg:py-20" aria-labelledby="support-title">
      <div className="wrap grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <Reveal>
          <SectionHeading
            id="support-title"
            kicker="شفافیت همکاری"
            title="اعتبار شرکت و پشتیبانی"
            copy="اعتبار آسان‌کار در قاعده‌هایی است که پیش از شروع گفته می‌شود. جزئیات هر سفارش فقط در قرارداد همان کار نوشته می‌شود."
          />
        </Reveal>
        <Reveal delay={80} className="lg:row-span-2">
          <a
            href={`tel:${site.phoneTel}`}
            className="flex flex-col rounded-3xl bg-pine p-6 text-white shadow-[0_16px_36px_rgba(12,77,134,0.18)] sm:p-8 lg:sticky lg:top-24"
          >
            <p className="text-sm font-bold text-foam">پشتیبانی تلفنی</p>
            <p className="mt-6 text-end text-4xl font-extrabold tracking-wide" dir="ltr">
              {site.phoneDisplay}
            </p>
            <p className="mt-4 text-lg font-extrabold">۲۴ ساعته</p>
            <p className="mt-2 text-base leading-8 text-foam">
              تماس تلفنی با همکاران پشتیبانی در تمام ساعت شبانه‌روز برقرار است.
            </p>
          </a>
        </Reveal>
        <ul className="grid gap-3">
          {pillars.map((item, index) => (
            <li key={item.title}>
              <Reveal delay={index * 60}>
                <article className="panel lift p-4 sm:p-5">
                  <h3 className="text-lg font-extrabold">{item.title}</h3>
                  <p className="mt-1 text-base leading-8 text-muted">{item.text}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
