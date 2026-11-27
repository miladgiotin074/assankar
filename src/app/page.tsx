import type { Metadata } from "next";
import { Audience } from "@/components/audience";
import { Coverage } from "@/components/coverage";
import { Faq } from "@/components/faq";
import { Frame } from "@/components/frame";
import { Handover } from "@/components/handover";
import { Hero } from "@/components/hero";
import { JsonLd } from "@/components/json-ld";
import { Quality } from "@/components/quality";
import { Support } from "@/components/support";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <Frame>
      <JsonLd />
      <Hero />
      <Audience />
      <Handover />
      <Coverage />
      <Quality />
      <Support />
      <Faq />
    </Frame>
  );
}
