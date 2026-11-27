import { faqs, site } from "@/lib/site";

export function JsonLd() {
  const organization = `${site.url}/#organization`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organization,
        name: site.name,
        alternateName: ["آسان کار", "AsanKar", site.latin],
        url: site.url,
        telephone: site.phoneTel,
        email: site.email,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: site.phoneTel,
          contactType: "customer support",
          availableLanguage: "Persian",
          areaServed: "IR",
          hoursAvailable: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            opens: "00:00",
            closes: "23:59",
          },
        },
        description: site.definition,
        areaServed: { "@type": "Country", name: "Iran" },
        address: {
          "@type": "PostalAddress",
          addressLocality: site.city,
          addressCountry: "IR",
        },
        knowsAbout: [site.keyword, "بسته‌بندی دستی", "سفارش بسته‌بندی"],
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        inLanguage: "fa-IR",
        publisher: { "@id": organization },
      },
      {
        "@type": "WebPage",
        "@id": `${site.url}/#webpage`,
        url: site.url,
        name: site.title,
        description: site.description,
        inLanguage: "fa-IR",
        isPartOf: { "@id": `${site.url}/#website` },
        about: { "@id": organization },
        primaryImageOfPage: `${site.url}/opengraph-image`,
        keywords: site.keyword,
      },
      {
        "@type": "Service",
        "@id": `${site.url}/#home-packaging`,
        name: site.keyword,
        serviceType: site.keyword,
        provider: { "@id": organization },
        areaServed: { "@type": "Country", name: "Iran" },
        description: site.definition,
      },
      {
        "@type": "Service",
        name: "سفارش بسته‌بندی دستی برای برندها",
        provider: { "@id": organization },
        areaServed: { "@type": "Country", name: "Iran" },
        description:
          "بسته‌بندی دستی محصول مجاز، با دستور یکسان و گزارش تعداد قطعه سالم و مردود.",
      },
      {
        "@type": "FAQPage",
        "@id": `${site.url}/#faq`,
        inLanguage: "fa-IR",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
