import { faqs, site } from "@/lib/site";

export function GET() {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.definition}`,
    "",
    `Primary search keyword: ${site.keyword}`,
    "",
    "AsanKar (آسان‌کار) is an Iran-based home packaging company for people aged 18 and over. After signup the worker chooses 1 to 3 products. Within 3 days the company freight team delivers them to the door with a packaging training video. The wage is paid before the finished goods are handed to the collection team, which then schedules the pickup. Shipping covers the whole country, including provinces, cities, counties, and villages. Phone support is available 24 hours. Careful workers are insured by the company after one month.",
    "",
    "## Pages",
    `- [صفحه اصلی](${site.url}/): ${site.keyword}`,
    `- [حریم خصوصی](${site.url}/privacy)`,
    "",
    "## Cooperation rules",
    "- Minimum age is 18.",
    "- After signup the worker personally chooses 1 to 3 products.",
    "- The freight team delivers to the door after 3 days, together with a training video.",
    "- The wage is paid before the finished goods are handed to the collection team.",
    "- After the work is ready, the collection team coordinates the pickup.",
    "- Quality matters more than speed. Careful workers are insured by the company after one month.",
    "- Shipping is available across Iran: provinces, cities, counties, and villages.",
    "- Phone support with the support staff is available 24 hours.",
    "- The binding amount is the number written in that order's contract.",
    "- Sterile, pharmaceutical, and other products unsuitable for home packing are refused.",
    "",
    "## Sample base rates",
    "These are sample piece rates only. The wage is paid before handover to the collection team, and the binding figure is the one in that order's contract.",
    "- Label and shrink: about 35 seconds, 1600 toman per accepted piece.",
    "- Sachet and pouch: about 70 seconds, 2800 toman per accepted piece.",
    "- Box and kit: about 130 seconds, 4700 toman per accepted piece.",
    "",
    "## FAQ",
    ...faqs.flatMap((faq) => [`### ${faq.q}`, faq.a, ""]),
    "## Contact",
    `- Phone: ${site.phoneTel}`,
    `- Email: ${site.email}`,
    `- City: ${site.city}, Iran. In-person meetings are by appointment.`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
