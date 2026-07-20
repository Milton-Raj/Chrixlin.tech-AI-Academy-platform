/**
 * Seed: admin login, the flagship course, two upcoming batches, testimonials,
 * FAQs, and a small set of sample students/payments so the admin dashboard
 * has data on first run. Safe to re-run (upserts / skips existing).
 * Reset everything with: npm run db:reset
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DAY = 86_400_000;

async function main() {
  // --- Admin ---------------------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@chrixlin.tech";
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD is not set. Copy .env.example to .env and choose a strong admin password before seeding."
    );
  }
  // Re-seeding resets the password to ADMIN_PASSWORD, so rotating the admin
  // credential is just: edit .env, re-run the seed.
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      name: "Chrixlin Admin",
      email: adminEmail,
      passwordHash,
    },
  });
  console.log(`Admin ready: ${adminEmail} (password from ADMIN_PASSWORD in .env)`);

  // --- Course --------------------------------------------------------------
  const course = await prisma.course.upsert({
    where: { slug: "ai-mastery" },
    update: {},
    create: {
      slug: "ai-mastery",
      title: "AI, Automation & Digital Growth Mastery",
      description:
        "Master ChatGPT, Claude AI, Gemini, Perplexity, n8n, Make, AI Agents, automation systems and business workflows through live training, real-world projects and certification.",
      durationDays: 15,
      price: 2999,
      offerPrice: 999,
      offerText: "Early Bird Offer",
      offerEndDate: new Date(Date.now() + 30 * DAY),
    },
  });

  // --- Batches (2 upcoming; the app's auto-sync keeps topping these up) ----
  if ((await prisma.batch.count()) === 0) {
    const start1 = new Date(Date.now() + 7 * DAY);
    const start2 = new Date(Date.now() + 14 * DAY);
    await prisma.batch.createMany({
      data: [
        {
          courseId: course.id,
          batchName: "Batch 1",
          startDate: start1,
          endDate: new Date(start1.getTime() + course.durationDays * DAY),
          capacity: 25,
          seatsFilled: 0,
          status: "OPEN",
        },
        {
          courseId: course.id,
          batchName: "Batch 2",
          startDate: start2,
          endDate: new Date(start2.getTime() + course.durationDays * DAY),
          capacity: 25,
          seatsFilled: 0,
          status: "OPEN",
        },
      ],
    });
  }

  // --- Testimonials --------------------------------------------------------
  if ((await prisma.testimonial.count()) === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          name: "Arjun Mehta",
          role: "Software Engineer, Bengaluru",
          content:
            "I automated half of my daily reporting with n8n within a week of finishing the course. My manager thinks I work weekends — I don't.",
          rating: 5,
          sortOrder: 1,
        },
        {
          name: "Priya Sharma",
          role: "Freelance Marketer",
          content:
            "The AI content systems module alone paid for the course 10x over. I now offer AI automation as a service to three retainer clients.",
          rating: 5,
          sortOrder: 2,
        },
        {
          name: "Rahul Verma",
          role: "Business Owner, Pune",
          content:
            "We built a WhatsApp support automation on day 12 of the course and it now handles 70% of our customer queries.",
          rating: 5,
          sortOrder: 3,
        },
        {
          name: "Sneha Iyer",
          role: "Career Switcher",
          content:
            "Went from zero AI knowledge to building AI agents in 15 days. The certificate helped me land interviews I couldn't get before.",
          rating: 5,
          sortOrder: 4,
        },
      ],
    });
  }

  // --- FAQs ----------------------------------------------------------------
  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({
      data: [
        {
          question: "Do I need any coding experience to join?",
          answer:
            "No. The course is designed for complete beginners. We use no-code tools like n8n and Make, and teach you to leverage AI tools like ChatGPT and Claude — no programming required.",
          sortOrder: 1,
        },
        {
          question: "Are the classes live or recorded?",
          answer:
            "All classes are 100% live so you can ask questions in real time. Sessions run on Zoom / Google Meet and your batch's meeting link is emailed to you automatically.",
          sortOrder: 2,
        },
        {
          question: "What if I miss a class?",
          answer:
            "Reach out to our support and we'll help you catch up before the next session. A student portal with recordings is coming soon.",
          sortOrder: 3,
        },
        {
          question: "Will I get a certificate?",
          answer:
            "Yes — a verified certificate with a unique certificate number and a public verification page you can share on LinkedIn and with employers.",
          sortOrder: 4,
        },
        {
          question: "How do I pay? Is it secure?",
          answer:
            "Payments are processed securely via Razorpay (UPI, cards, net banking, wallets). You receive an instant email receipt.",
          sortOrder: 5,
        },
        {
          question: "What happens right after I enroll?",
          answer:
            "You instantly receive a welcome email with your receipt and batch details, a reminder a day before your batch starts, and the live class link when class begins.",
          sortOrder: 6,
        },
      ],
    });
  }

  // --- Sample students & payments (so the dashboard isn't empty) -----------
  // Demo data only — opt in with SEED_SAMPLE_DATA=true. Never seed these into
  // production, where the dashboard should reflect real enrollments.
  if (process.env.SEED_SAMPLE_DATA === "true" && (await prisma.student.count()) === 0) {
    const batch = await prisma.batch.findFirst({ orderBy: { startDate: "asc" } });
    if (batch) {
      const samples = [
        ["Aarav Kumar", "aarav.sample@example.com", "IT Professional"],
        ["Diya Patel", "diya.sample@example.com", "Freelancer"],
        ["Vihaan Singh", "vihaan.sample@example.com", "Business Owner"],
        ["Ananya Reddy", "ananya.sample@example.com", "Student"],
        ["Kabir Shah", "kabir.sample@example.com", "Marketing Manager"],
        ["Ishita Nair", "ishita.sample@example.com", "Entrepreneur"],
      ] as const;
      let i = 0;
      for (const [name, email, profession] of samples) {
        const student = await prisma.student.create({
          data: {
            name,
            email,
            phone: `+91 98${String(76543210 + i)}`,
            country: "India",
            profession,
            experience: i % 2 ? "Beginner" : "Intermediate",
            createdAt: new Date(Date.now() - (45 - i * 7) * DAY),
          },
        });
        const registration = await prisma.registration.create({
          data: {
            studentId: student.id,
            batchId: batch.id,
            status: "PAID",
            paymentStatus: "PAID",
            createdAt: new Date(Date.now() - (45 - i * 7) * DAY),
          },
        });
        await prisma.payment.create({
          data: {
            registrationId: registration.id,
            amount: 999,
            status: "PAID",
            provider: "RAZORPAY",
            orderId: `order_sample_${i}`,
            transactionId: `pay_sample_${i}`,
            paymentDate: new Date(Date.now() - (45 - i * 7) * DAY),
          },
        });
        i++;
      }
      await prisma.batch.update({
        where: { id: batch.id },
        data: { seatsFilled: samples.length },
      });
      console.log(`Seeded ${samples.length} sample students into ${batch.batchName}`);
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
