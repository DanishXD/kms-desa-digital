// Seed MongoDB dari src/data/seed-data.ts.  Jalankan:  npx prisma db seed
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { ASSESSMENT_QUESTIONS, CATEGORIES, CLAIMS, INNOVATIONS, INNOVATORS, USERS, VILLAGES } from "../src/data/seed-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.assessmentResult.deleteMany().catch(() => null);
  await prisma.notification.deleteMany().catch(() => null);
  await prisma.auditLog.deleteMany().catch(() => null);
  await prisma.assessmentQuestion.deleteMany().catch(() => null);
  await prisma.claim.deleteMany().catch(() => null);
  await prisma.innovation.deleteMany().catch(() => null);
  await prisma.category.deleteMany().catch(() => null);
  await prisma.village.deleteMany().catch(() => null);
  await prisma.innovator.deleteMany().catch(() => null);
  await prisma.user.deleteMany().catch(() => null);

  for (const c of CATEGORIES) {
    await prisma.category.create({ data: { name: c.name, slug: c.slug, description: c.description } });
  }
  const userIds: Record<string, string> = {};
  for (const u of USERS) {
    const created = await prisma.user.create({
      data: { email: u.email, name: u.name, role: u.role as "ADMIN", passwordHash: await bcrypt.hash(u.password, 10) },
    });
    userIds[u.email] = created.id;
  }
  for (const s of INNOVATORS) {
    await prisma.innovator.create({
      data: { userId: userIds[s.userEmail], name: s.name, organization: s.organization, bio: s.bio, location: s.location, website: s.website },
    });
  }
  const villageIds: Record<string, string> = {};
  for (const s of VILLAGES) {
    const v = await prisma.village.create({
      data: { userId: s.userEmail ? userIds[s.userEmail] : undefined, name: s.name, province: s.province, regency: s.regency, district: s.district, description: s.description, population: s.population, potential: s.potential, infrastructure: s.infrastructure, digitalReadiness: s.digitalReadiness },
    });
    villageIds[s.name] = v.id;
  }
  const innovators = await prisma.innovator.findMany();
  const categories = await prisma.category.findMany();
  const innovationIds: Record<string, string> = {};
  for (const s of INNOVATIONS) {
    const inv = innovators.find((x) => x.name === s.innovatorName) ?? innovators[0];
    const cat = categories.find((x) => x.slug === s.categorySlug) ?? categories[0];
    const created = await prisma.innovation.create({
      data: { title: s.title, slug: s.slug, shortDescription: s.shortDescription, description: s.description, categoryId: cat.id, problem: s.problem, solution: s.solution, benefits: s.benefits, implementation: s.implementation, technology: s.technology, requirements: s.requirements, estimatedCost: s.estimatedCost, impact: s.impact, status: s.status as "PUBLISHED", innovatorId: inv.id, publishedAt: s.status === "PUBLISHED" ? new Date() : undefined },
    });
    innovationIds[s.slug] = created.id;
  }
  for (const s of CLAIMS) {
    await prisma.claim.create({
      data: { innovationId: innovationIds[s.innovationSlug], villageId: villageIds[s.villageName], status: s.status as "PENDING", message: s.message, notes: s.notes },
    });
  }
  for (const q of ASSESSMENT_QUESTIONS) {
    await prisma.assessmentQuestion.create({ data: { category: q.category, text: q.text, weight: q.weight, order: q.order } });
  }
  console.log("Seed OK: 6 users, 3 innovators, 5 villages, 15 innovations, 5 claims, 7 questions.");
}

main().finally(() => prisma.$disconnect());
