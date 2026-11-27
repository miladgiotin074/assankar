import { faqs } from "@/lib/site";
import { FaqList } from "@/components/faq-list";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

export function Faq() {
  return (
    <section id="porsesh" className="band bg-paper-deep" aria-labelledby="faq-title">
      <div className="wrap">
        <Reveal>
          <SectionHeading
            id="faq-title"
            kicker="پیش از شروع"
            title="پرسش‌های متداول"
            copy="جواب‌ها همان روند همکاری است: انتخاب ۱ تا ۳ قلم، تحویل در ۳ روز، آموزش، دستمزد و جمع‌آوری."
          />
        </Reveal>
        <Reveal className="mt-8 lg:mt-10" delay={60}>
          <FaqList items={faqs} />
        </Reveal>
      </div>
    </section>
  );
}
