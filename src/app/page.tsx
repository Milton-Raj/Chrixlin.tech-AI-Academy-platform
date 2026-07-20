import { prisma } from "@/lib/db";
import { getEnrollableBatches } from "@/lib/batches";
import { getSettings, settingInt } from "@/lib/settings";
import type { PublicBatch, PublicCourse, PublicFaq, PublicTestimonial } from "@/lib/types";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import Audience from "@/components/landing/Audience";
import Benefits from "@/components/landing/Benefits";
import DreamOutcome from "@/components/landing/DreamOutcome";
import Roadmap from "@/components/landing/Roadmap";
import Projects from "@/components/landing/Projects";
import Certification from "@/components/landing/Certification";
import BatchPicker from "@/components/landing/BatchPicker";
import Pricing from "@/components/landing/Pricing";
import Testimonials from "@/components/landing/Testimonials";
import FaqSection from "@/components/landing/FaqSection";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

export const dynamic = "force-dynamic"; // live seats, prices & CMS content

export default async function LandingPage() {
  const [settings, batches, course, testimonials, faqs] = await Promise.all([
    getSettings(),
    getEnrollableBatches(),
    prisma.course.findFirst({ where: { active: true } }),
    prisma.testimonial.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.faq.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const courseDto: PublicCourse | null = course && {
    id: course.id,
    title: course.title,
    description: course.description,
    durationDays: course.durationDays,
    price: course.price,
    offerPrice: course.offerPrice,
    offerText: course.offerText,
    offerEndDate: course.offerEndDate?.toISOString() ?? null,
  };

  const batchDtos: PublicBatch[] = batches.map((b) => ({
    id: b.id,
    batchName: b.batchName,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    capacity: b.capacity,
    seatsFilled: b.seatsFilled,
    status: b.status,
  }));

  const testimonialDtos: PublicTestimonial[] = testimonials.map((t) => ({
    id: t.id,
    name: t.name,
    role: t.role,
    content: t.content,
    imageUrl: t.imageUrl,
    videoUrl: t.videoUrl,
    type: t.type,
    rating: t.rating,
  }));

  const faqDtos: PublicFaq[] = faqs.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
  }));

  return (
    <main>
      <Navbar ctaText={settings.ctaText} />
      <Hero
        headline={settings.heroHeadline}
        subheadline={settings.heroSubheadline}
        badge={settings.heroBadge}
        ctaText={settings.ctaText}
        offer={
          courseDto
            ? {
                price: courseDto.price,
                offerPrice: courseDto.offerPrice,
                offerText: courseDto.offerText,
                timerMinutes: settingInt(settings, "offerTimerMinutes", 0),
                timerLabel: settings.offerTimerLabel,
              }
            : undefined
        }
      />
      <TrustBar
        stats={[
          { label: "Students Trained", value: settingInt(settings, "statsStudents", 0) },
          { label: "Projects Completed", value: settingInt(settings, "statsProjects", 0) },
          { label: "Certifications Issued", value: settingInt(settings, "statsCertificates", 0) },
          { label: "Live Workshops", value: settingInt(settings, "statsWorkshops", 0) },
        ]}
      />
      <Audience />
      <Benefits />
      <DreamOutcome />
      <Roadmap />
      <Projects />
      <Certification />
      <BatchPicker batches={batchDtos} durationDays={courseDto?.durationDays ?? 15} />
      {courseDto && (
        <Pricing
          course={courseDto}
          timerMinutes={settingInt(settings, "offerTimerMinutes", 0)}
          timerLabel={settings.offerTimerLabel}
          ctaText={settings.ctaText}
        />
      )}
      <Testimonials testimonials={testimonialDtos} />
      <FaqSection faqs={faqDtos} />
      <Contact
        whatsapp={settings.contactWhatsapp}
        email={settings.contactEmail}
        socials={{
          linkedin: settings.socialLinkedin,
          instagram: settings.socialInstagram,
          youtube: settings.socialYoutube,
          twitter: settings.socialTwitter,
        }}
      />
      <Footer />
    </main>
  );
}
