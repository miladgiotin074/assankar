import { places } from "@/lib/site";
import { Reveal } from "@/components/reveal";

export function Coverage() {
  return (
    <section id="sarasar" className="bg-pine text-white" aria-labelledby="coverage-title">
      <div className="wrap py-12 lg:py-16">
        <Reveal>
          <p className="kicker kicker-light">پوشش ارسال</p>
          <h2 id="coverage-title" className="title mt-3 text-white">
            ارسال به سراسر کشور
          </h2>
          <p className="copy mt-4 max-w-2xl text-foam">
            امکان ارسال محصولات به تمام نقاط کشور فراهم است.
          </p>
        </Reveal>
        <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {places.map((place, index) => (
            <li key={place}>
              <Reveal delay={index * 60}>
                <p className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-center text-lg font-extrabold">
                  {place}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
