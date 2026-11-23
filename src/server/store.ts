// Repository KMS — baca/tulis ke MongoDB (Prisma) bila DATABASE_URL ada,
// selain itu ke dataset seed in-memory (MODE DEMO, reset tiap restart).
// Semua business-rule (§32) dicek di sini + guard route, bukan di client.
import bcrypt from "bcryptjs";
import { ASSESSMENT_QUESTIONS, CATEGORIES, CLAIMS, INNOVATIONS, INNOVATORS, USERS, VILLAGES } from "@/data/seed-data";
import { claimFilterFor } from "@/lib/access";
import { canTransitionClaim, canTransitionInnovation } from "@/lib/scoring";
import { isObjectId, slugify } from "@/lib/utils";

export interface SessionUser { id: string; email: string; name: string; role: "INNOVATOR" | "VILLAGE" | "ADMIN"; innovatorId?: string; villageId?: string; }
export interface InnovationFull {
  id: string; title: string; slug: string; shortDescription: string; description: string;
  categoryId: string; categoryName: string; categorySlug: string;
  problem: string; solution: string; benefits: string; implementation: string;
  technology: string; requirements: string; estimatedCost: string; impact: string;
  image?: string; status: string; innovatorId: string; innovatorName: string; innovatorOrg: string;
  createdAt: string; updatedAt: string; publishedAt?: string; claimCount: number;
}
export interface ClaimFull {
  id: string; innovationId: string; innovationTitle: string; villageId: string; villageName: string;
  status: string; message: string; notes?: string; submittedAt: string; reviewedAt?: string;
}

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// ---------- in-memory build dari seed ----------
interface MemUser extends SessionUser { passwordHash: string; }
function buildMemory() {
  const users: MemUser[] = USERS.map((u, i) => ({
    id: `u_seed_${i}`, email: u.email, name: u.name, role: u.role,
    passwordHash: bcrypt.hashSync(u.password, 4),
  }));
  const innovators = INNOVATORS.map((s, i) => ({
    id: `n_seed_${i}`, userId: users.find((u) => u.email === s.userEmail)?.id ?? users[1].id,
    name: s.name, organization: s.organization, bio: s.bio, location: s.location, website: s.website,
    photo: undefined as string | undefined,
  }));
  innovators.forEach((n) => {
    const u = users.find((x) => x.id === n.userId);
    if (u && !u.innovatorId) u.innovatorId = n.id;
  });
  const villages = VILLAGES.map((s, i) => ({
    id: `v_seed_${i}`, userId: s.userEmail ? users.find((u) => u.email === s.userEmail)?.id : undefined,
    ...s, image: undefined as string | undefined, latitude: undefined as number | undefined, longitude: undefined as number | undefined,
    createdAt: now(), updatedAt: now(),
  }));
  villages.forEach((v) => {
    if (v.userId) { const u = users.find((x) => x.id === v.userId); if (u) u.villageId = v.id; }
  });
  const categories = CATEGORIES.map((c, i) => ({ id: `c_seed_${i}`, ...c }));
  const innovations = INNOVATIONS.map((s, i) => ({
    id: `i_seed_${i}`, ...s,
    categoryId: categories.find((c) => c.slug === s.categorySlug)?.id ?? categories[0].id,
    innovatorId: innovators.find((n) => n.name === s.innovatorName)?.id ?? innovators[0].id,
    image: undefined as string | undefined,
    createdAt: now(), updatedAt: now(), publishedAt: s.status === "PUBLISHED" ? now() : undefined as string | undefined,
  }));
  const claims: ClaimFull[] = CLAIMS.map((s, i) => ({
    id: `cl_seed_${i}`,
    innovationId: innovations.find((x) => x.slug === s.innovationSlug)?.id ?? innovations[0].id,
    innovationTitle: innovations.find((x) => x.slug === s.innovationSlug)?.title ?? "",
    villageId: villages.find((v) => v.name === s.villageName)?.id ?? villages[0].id,
    villageName: s.villageName, status: s.status, message: s.message, notes: s.notes,
    submittedAt: now(), reviewedAt: s.status === "PENDING" ? undefined : now(),
  }));
  const questions = ASSESSMENT_QUESTIONS.map((q, i) => ({ id: `q_seed_${i}`, ...q }));
  return { users, innovators, villages, categories, innovations, claims, questions, notifications: [] as { id: string; userId: string; type: string; title: string; body?: string; read: boolean; createdAt: string }[], audit: [] as { id: string; actorId?: string; action: string; entity: string; entityId?: string; createdAt: string }[] };
}
type Mem = ReturnType<typeof buildMemory>;
const mem: Mem = buildMemory();
export const isDbMode = () => !!process.env.DATABASE_URL;

// Prisma lazy (client di-generate via `prisma generate`; aman bila belum ada → fallback memori)
async function prisma() {
  if (!isDbMode()) return null;
  try {
    const { PrismaClient } = await import("@prisma/client");
    const g = globalThis as unknown as { __prisma?: InstanceType<typeof PrismaClient> };
    g.__prisma ??= new PrismaClient();
    return g.__prisma;
  } catch { return null; }
}
function notify(userId: string | undefined, type: string, title: string, body?: string) {
  if (!userId) return;
  mem.notifications.unshift({ id: uid("nt"), userId, type, title, body, read: false, createdAt: now() });
}
function audit(actorId: string | undefined, action: string, entity: string, entityId?: string) {
  mem.audit.unshift({ id: uid("au"), actorId, action, entity, entityId, createdAt: now() });
}

// ---------- users / auth ----------
export async function findUserByEmail(email: string): Promise<(SessionUser & { passwordHash?: string }) | null> {
  const p = await prisma();
  if (p) {
    const u = await p.user.findUnique({ where: { email }, include: { innovator: true, villages: true } });
    if (!u) return null;
    return { id: u.id, email: u.email, name: u.name, role: u.role as SessionUser["role"], passwordHash: u.passwordHash ?? undefined, innovatorId: u.innovator?.id, villageId: u.villages[0]?.id };
  }
  const u = mem.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
  return u ? clone({ id: u.id, email: u.email, name: u.name, role: u.role, passwordHash: u.passwordHash, innovatorId: u.innovatorId, villageId: u.villageId }) : null;
}
export async function verifyCredentials(email: string, password: string) {
  const u = await findUserByEmail(email);
  if (!u?.passwordHash) return null;
  if (!(await bcrypt.compare(password, u.passwordHash))) return null;
  const { passwordHash, ...safe } = u;
  void passwordHash;
  return safe as SessionUser;
}
export async function registerUser(name: string, email: string, password: string, role: "INNOVATOR" | "VILLAGE"): Promise<SessionUser> {
  if (await findUserByEmail(email)) throw new Error("Email sudah terdaftar.");
  const hash = await bcrypt.hash(password, 10);
  const p = await prisma();
  if (p) {
    const u = await p.user.create({ data: { email, name, role: role as "INNOVATOR" | "VILLAGE", passwordHash: hash } });
    if (role === "INNOVATOR") {
      const inv = await p.innovator.create({ data: { userId: u.id, name } });
      return { id: u.id, email, name, role, innovatorId: inv.id };
    }
    const vil = await p.village.create({ data: { userId: u.id, name: `Desa ${name}`, province: "Jawa Barat", regency: "-", district: "-" } });
    return { id: u.id, email, name, role, villageId: vil.id };
  }
  const id = uid("u");
  mem.users.push({ id, email, name, role, passwordHash: hash });
  audit(id, "REGISTER", "User", id);
  if (role === "INNOVATOR") {
    const nid = uid("n");
    mem.innovators.push({ id: nid, userId: id, name, organization: "", bio: "", location: "", website: undefined, photo: undefined });
    mem.users.find((x) => x.id === id)!.innovatorId = nid;
    return { id, email, name, role, innovatorId: nid };
  }
  const vid = uid("v");
  mem.villages.push({ id: vid, userId: id, name: `Desa ${name}`, province: "Jawa Barat", regency: "-", district: "-", description: "", population: 0, potential: [], infrastructure: [], digitalReadiness: "LOW", image: undefined, latitude: undefined, longitude: undefined, createdAt: now(), updatedAt: now() });
  mem.users.find((x) => x.id === id)!.villageId = vid;
  return { id, email, name, role, villageId: vid };
}

// ---------- innovations ----------
function toFull(i: Mem["innovations"][number]): InnovationFull {
  const cat = mem.categories.find((c) => c.id === i.categoryId)!;
  const inv = mem.innovators.find((n) => n.id === i.innovatorId)!;
  return { ...clone(i), categoryName: cat.name, categorySlug: cat.slug, innovatorName: inv.name, innovatorOrg: inv.organization, claimCount: mem.claims.filter((c) => c.innovationId === i.id && c.status !== "CANCELLED").length };
}
export interface InnovationQuery { q?: string; category?: string; status?: string; mine?: string; sort?: string; page?: number; perPage?: number; publishedOnly?: boolean; }
export async function listInnovations(query: InnovationQuery = {}) {
  const p = await prisma();
  if (p) {
    const where: Record<string, unknown> = {};
    if (query.publishedOnly) where.status = "PUBLISHED";
    if (query.status) where.status = query.status;
    if (query.mine) where.innovatorId = query.mine;
    if (query.category) where.category = { slug: query.category };
    if (query.q) where.OR = [{ title: { contains: query.q, mode: "insensitive" } }, { description: { contains: query.q, mode: "insensitive" } }, { shortDescription: { contains: query.q, mode: "insensitive" } }];
    const orderBy = query.sort === "oldest" ? { createdAt: "asc" as const } : query.sort === "title" ? { title: "asc" as const } : { createdAt: "desc" as const };
    const page = Math.max(1, query.page ?? 1);
    const perPage = Math.min(24, Math.max(1, query.perPage ?? 9));
    const [total, rows] = await Promise.all([
      p.innovation.count({ where }), p.innovation.findMany({ where, orderBy, skip: (page - 1) * perPage, take: perPage, include: { category: true, innovator: true, _count: { select: { claims: true } } } }),
    ]);
    return { items: rows.map((i) => ({ id: i.id, title: i.title, slug: i.slug, shortDescription: i.shortDescription, description: i.description, categoryId: i.categoryId, categoryName: i.category.name, categorySlug: i.category.slug, problem: i.problem ?? "", solution: i.solution ?? "", benefits: i.benefits ?? "", implementation: i.implementation ?? "", technology: i.technology ?? "", requirements: i.requirements ?? "", estimatedCost: i.estimatedCost ?? "", impact: i.impact ?? "", status: i.status, innovatorId: i.innovatorId, innovatorName: i.innovator.name, innovatorOrg: i.innovator.organization ?? "", createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(), publishedAt: i.publishedAt?.toISOString(), claimCount: i._count.claims })), total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
  }
  let items = mem.innovations.map(toFull);
  if (query.publishedOnly) items = items.filter((i) => i.status === "PUBLISHED");
  if (query.status) items = items.filter((i) => i.status === query.status);
  if (query.mine) items = items.filter((i) => i.innovatorId === query.mine);
  if (query.category) items = items.filter((i) => i.categorySlug === query.category);
  if (query.q) {
    const q = query.q.toLowerCase();
    items = items.filter((i) => `${i.title} ${i.description} ${i.shortDescription} ${i.innovatorName} ${i.categoryName}`.toLowerCase().includes(q));
  }
  items.sort((a, b) => query.sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : query.sort === "title" ? a.title.localeCompare(b.title) : b.createdAt.localeCompare(a.createdAt));
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(24, Math.max(1, query.perPage ?? 9));
  const total = items.length;
  return { items: items.slice((page - 1) * perPage, page * perPage), total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}
export async function getInnovation(slugOrId: string): Promise<InnovationFull | null> {
  const p = await prisma();
  if (p) {
    const i = await p.innovation.findFirst({ where: isObjectId(slugOrId) ? { OR: [{ slug: slugOrId }, { id: slugOrId }] } : { slug: slugOrId }, include: { category: true, innovator: true, _count: { select: { claims: true } } } });
    if (!i) return null;
    return { id: i.id, title: i.title, slug: i.slug, shortDescription: i.shortDescription, description: i.description, categoryId: i.categoryId, categoryName: i.category.name, categorySlug: i.category.slug, problem: i.problem ?? "", solution: i.solution ?? "", benefits: i.benefits ?? "", implementation: i.implementation ?? "", technology: i.technology ?? "", requirements: i.requirements ?? "", estimatedCost: i.estimatedCost ?? "", impact: i.impact ?? "", status: i.status, innovatorId: i.innovatorId, innovatorName: i.innovator.name, innovatorOrg: i.innovator.organization ?? "", createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(), publishedAt: i.publishedAt?.toISOString(), claimCount: i._count.claims };
  }
  const i = mem.innovations.find((x) => x.slug === slugOrId || x.id === slugOrId);
  return i ? toFull(i) : null;
}
export async function createInnovation(user: SessionUser, input: { title: string; shortDescription: string; description: string; categoryId: string; problem?: string; solution?: string; benefits?: string; implementation?: string; technology?: string; requirements?: string; estimatedCost?: string; impact?: string }) {
  if (user.role !== "INNOVATOR" || !user.innovatorId) throw new Error("Hanya INNOVATOR yang dapat membuat inovasi.");
  const p = await prisma();
  const slugBase = slugify(input.title);
  if (p) {
    const created = await p.innovation.create({ data: { ...input, slug: `${slugBase}-${Date.now().toString(36)}`, status: "DRAFT", innovatorId: user.innovatorId } });
    return created.slug;
  }
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
  mem.innovations.unshift({ id: uid("i"), slug, status: "DRAFT", innovatorId: user.innovatorId, image: undefined, createdAt: now(), updatedAt: now(), publishedAt: undefined, ...input } as Mem["innovations"][number]);
  audit(user.id, "CREATE", "Innovation", slug);
  notify(user.id, "innovation_submitted", "Draf inovasi dibuat", input.title);
  return slug;
}
export async function updateInnovation(user: SessionUser, id: string, input: Partial<Parameters<typeof createInnovation>[1]>, newStatus?: string) {
  const p = await prisma();
  if (p) {
    const cur = await p.innovation.findUnique({ where: { id }, include: { innovator: true } });
    if (!cur) throw new Error("Inovasi tidak ditemukan.");
    const owner = cur.innovator.userId === user.id || user.role === "ADMIN";
    if (!owner) throw new Error("Tidak berhak mengubah inovasi ini.");
    if (newStatus && !canTransitionInnovation(cur.status, newStatus)) throw new Error(`Transisi ${cur.status} → ${newStatus} tidak diizinkan.`);
    if (newStatus && user.role !== "ADMIN" && !["SUBMITTED", "DRAFT"].includes(newStatus)) throw new Error("Hanya ADMIN yang dapat mempublish/meninjau.");
    const data: Record<string, unknown> = { ...input };
    if (newStatus) { data.status = newStatus; if (newStatus === "PUBLISHED") data.publishedAt = new Date(); }
    await p.innovation.update({ where: { id }, data });
    await p.auditLog.create({ data: { actorId: user.id, action: newStatus ? `STATUS_${newStatus}` : "UPDATE", entity: "Innovation", entityId: id } }).catch(() => null);
    return;
  }
  const i = mem.innovations.find((x) => x.id === id);
  if (!i) throw new Error("Inovasi tidak ditemukan.");
  const innovator = mem.innovators.find((n) => n.id === i.innovatorId)!;
  if (innovator.userId !== user.id && user.role !== "ADMIN") throw new Error("Tidak berhak mengubah inovasi ini.");
  if (newStatus) {
    if (!canTransitionInnovation(i.status, newStatus)) throw new Error(`Transisi ${i.status} → ${newStatus} tidak diizinkan.`);
    if (user.role !== "ADMIN" && !["SUBMITTED", "DRAFT"].includes(newStatus)) throw new Error("Hanya ADMIN yang dapat mempublish/meninjau.");
    i.status = newStatus as Mem["innovations"][number]["status"];
    if (newStatus === "PUBLISHED") i.publishedAt = now();
    const ownerUser = mem.users.find((u) => u.id === innovator.userId);
    notify(ownerUser?.id, "innovation_status", `Status inovasi: ${newStatus}`, i.title);
  }
  Object.assign(i, input, { updatedAt: now() });
  audit(user.id, newStatus ? `STATUS_${newStatus}` : "UPDATE", "Innovation", id);
}

// ---------- villages / innovators ----------
export async function listVillages(q?: string) {
  const p = await prisma();
  if (p) {
    const rows = await p.village.findMany({ where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { regency: { contains: q, mode: "insensitive" } }] } : undefined, orderBy: { name: "asc" }, include: { _count: { select: { claims: true } } } });
    return rows.map((v) => ({ ...v, claimCount: v._count.claims, createdAt: v.createdAt.toISOString(), updatedAt: v.updatedAt.toISOString() }));
  }
  const query = (q ?? "").toLowerCase();
  return clone(mem.villages.filter((v) => !query || `${v.name} ${v.regency} ${v.province}`.toLowerCase().includes(query)).map((v) => ({ ...v, claimCount: mem.claims.filter((c) => c.villageId === v.id).length })));
}
export async function getVillage(id: string) {
  const p = await prisma();
  if (p) {
    if (!isObjectId(id)) return null;
    const v = await p.village.findUnique({ where: { id }, include: { claims: { include: { innovation: true } } } });
    if (!v) return null;
    return { ...v, createdAt: v.createdAt.toISOString(), updatedAt: v.updatedAt.toISOString(), claims: v.claims.map((c) => ({ id: c.id, innovationTitle: c.innovation.title, status: c.status, submittedAt: c.submittedAt.toISOString() })) };
  }
  const v = mem.villages.find((x) => x.id === id);
  if (!v) return null;
  return clone({ ...v, claimCount: mem.claims.filter((c) => c.villageId === v.id).length, claims: mem.claims.filter((c) => c.villageId === v.id).map((c) => ({ id: c.id, innovationTitle: c.innovationTitle, status: c.status, submittedAt: c.submittedAt })) });
}
export async function listInnovators() {
  const p = await prisma();
  if (p) {
    const rows = await p.innovator.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { innovations: true } } } });
    return rows.map((r) => ({ ...r, innovationCount: r._count.innovations }));
  }
  return clone(mem.innovators.map((n) => ({ ...n, innovationCount: mem.innovations.filter((i) => i.innovatorId === n.id && i.status === "PUBLISHED").length })));
}
export async function getInnovator(id: string) {
  const p = await prisma();
  if (p) {
    if (!isObjectId(id)) return null;
    const n = await p.innovator.findUnique({ where: { id }, include: { innovations: { where: { status: "PUBLISHED" }, include: { category: true } } } });
    if (!n) return null;
    return { ...n, innovationCount: n.innovations.length, innovations: n.innovations.map((i) => ({ id: i.id, title: i.title, slug: i.slug, shortDescription: i.shortDescription, categoryName: i.category.name })) };
  }
  const n = mem.innovators.find((x) => x.id === id);
  if (!n) return null;
  const pubs = mem.innovations.filter((i) => i.innovatorId === id && i.status === "PUBLISHED").map(toFull);
  return clone({ ...n, innovationCount: pubs.length, innovations: pubs });
}
export async function listCategories() {
  const p = await prisma();
  if (p) return p.category.findMany({ orderBy: { name: "asc" } });
  return clone(mem.categories);
}
export async function listQuestions() {
  const p = await prisma();
  if (p) return (await p.assessmentQuestion.findMany({ orderBy: { order: "asc" } })).map((q) => ({ id: q.id, category: q.category, text: q.text, weight: q.weight, order: q.order }));
  return clone(mem.questions);
}

// ---------- claims ----------
export async function createClaim(user: SessionUser, innovationId: string, message: string) {
  if (user.role !== "VILLAGE" || !user.villageId) throw new Error("Hanya akun DESA yang dapat mengajukan adopsi.");
  const p = await prisma();
  if (p) {
    const dup = await p.claim.findFirst({ where: { innovationId, villageId: user.villageId, status: { in: ["PENDING", "REVIEWING"] } } });
    if (dup) throw new Error("Pengajuan untuk inovasi ini masih aktif.");
    const c = await p.claim.create({ data: { innovationId, villageId: user.villageId, message } });
    return c.id;
  }
  const dup = mem.claims.find((c) => c.innovationId === innovationId && c.villageId === user.villageId && ["PENDING", "REVIEWING"].includes(c.status));
  if (dup) throw new Error("Pengajuan untuk inovasi ini masih aktif.");
  const village = mem.villages.find((v) => v.id === user.villageId)!;
  const innovation = mem.innovations.find((i) => i.id === innovationId)!;
  const id = uid("cl");
  mem.claims.unshift({ id, innovationId, innovationTitle: innovation.title, villageId: village.id, villageName: village.name, status: "PENDING", message, submittedAt: now() });
  audit(user.id, "CREATE", "Claim", id);
  const admins = mem.users.filter((u) => u.role === "ADMIN");
  admins.forEach((a) => notify(a.id, "claim_submitted", "Pengajuan adopsi baru", `${village.name} → ${innovation.title}`));
  return id;
}
export async function listClaims(filter: { villageId?: string; status?: string; innovatorId?: string } = {}) {
  const p = await prisma();
  if (p) {
    const rows = await p.claim.findMany({
      where: {
        ...(filter.villageId ? { villageId: filter.villageId } : {}),
        ...(filter.status ? { status: filter.status as "PENDING" } : {}),
        ...(filter.innovatorId ? { innovation: { is: { innovatorId: filter.innovatorId } } } : {}),
      },
      orderBy: { submittedAt: "desc" },
      include: { innovation: true, village: true },
    });
    return rows.map((c) => ({ id: c.id, innovationId: c.innovationId, innovationTitle: c.innovation.title, villageId: c.villageId, villageName: c.village.name, status: c.status, message: c.message, notes: c.notes ?? undefined, submittedAt: c.submittedAt.toISOString(), reviewedAt: c.reviewedAt?.toISOString() }));
  }
  let items = mem.claims.map(clone);
  if (filter.villageId) items = items.filter((c) => c.villageId === filter.villageId);
  if (filter.status) items = items.filter((c) => c.status === filter.status);
  const innovatorId = filter.innovatorId;
  if (innovatorId) items = items.filter((c) => mem.innovations.find((i) => i.id === c.innovationId)?.innovatorId === innovatorId);
  return items;
}
/** Batas otorisasi baca klaim: scope selalu dari sesi, bukan dari query client. */
export async function listClaimsForUser(user: SessionUser, filter: { status?: string; villageId?: string } = {}) {
  const scope = claimFilterFor(user);
  if (scope.all) return listClaims({ status: filter.status, villageId: filter.villageId });
  if (!scope.villageId && !scope.innovatorId) return [];
  return listClaims({ status: filter.status, villageId: scope.villageId, innovatorId: scope.innovatorId });
}
export async function moderateClaim(user: SessionUser, id: string, action: "REVIEWING" | "APPROVED" | "REJECTED", notes?: string) {
  if (user.role !== "ADMIN") throw new Error("Hanya ADMIN yang dapat memoderasi pengajuan.");
  const p = await prisma();
  if (p) {
    const cur = await p.claim.findUnique({ where: { id }, include: { village: true, innovation: true } });
    if (!cur) throw new Error("Claim tidak ditemukan.");
    if (!canTransitionClaim(cur.status, action)) throw new Error(`Transisi ${cur.status} → ${action} tidak diizinkan.`);
    await p.claim.update({ where: { id }, data: { status: action, notes, reviewedById: user.id, reviewedAt: new Date() } });
    return;
  }
  const c = mem.claims.find((x) => x.id === id);
  if (!c) throw new Error("Claim tidak ditemukan.");
  if (!canTransitionClaim(c.status, action)) throw new Error(`Transisi ${c.status} → ${action} tidak diizinkan.`);
  c.status = action; c.notes = notes; c.reviewedAt = now();
  audit(user.id, `CLAIM_${action}`, "Claim", id);
  const village = mem.villages.find((v) => v.id === c.villageId);
  const reqUser = mem.users.find((u) => u.id === village?.userId);
  notify(reqUser?.id, "claim_status", `Pengajuan ${action}`, c.innovationTitle);
}
export async function cancelClaim(user: SessionUser, id: string) {
  const p = await prisma();
  if (p) {
    const cur = await p.claim.findUnique({ where: { id }, include: { village: true } });
    if (!cur) throw new Error("Claim tidak ditemukan.");
    if (user.role !== "ADMIN" && cur.village.userId !== user.id) throw new Error("Tidak berhak membatalkan.");
    await p.claim.update({ where: { id }, data: { status: "CANCELLED" } });
    return;
  }
  const c = mem.claims.find((x) => x.id === id);
  if (!c) throw new Error("Claim tidak ditemukan.");
  const village = mem.villages.find((v) => v.id === c.villageId);
  if (user.role !== "ADMIN" && village?.userId !== user.id) throw new Error("Tidak berhak membatalkan.");
  c.status = "CANCELLED";
  audit(user.id, "CLAIM_CANCELLED", "Claim", id);
}

// ---------- dashboard / analytics / notifications ----------
export async function dashboardStats() {
  const p = await prisma();
  if (p) {
    const [villages, innovators, innovations, pendingSub, pendingClaims, published] = await Promise.all([
      p.village.count(), p.innovator.count(), p.innovation.count(),
      p.innovation.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      p.claim.count({ where: { status: { in: ["PENDING", "REVIEWING"] } } }),
      p.innovation.count({ where: { status: "PUBLISHED" } }),
    ]);
    return { villages, innovators, innovations, pendingSub, pendingClaims, published };
  }
  return {
    villages: mem.villages.length, innovators: mem.innovators.length, innovations: mem.innovations.length,
    pendingSub: mem.innovations.filter((i) => ["SUBMITTED", "UNDER_REVIEW"].includes(i.status)).length,
    pendingClaims: mem.claims.filter((c) => ["PENDING", "REVIEWING"].includes(c.status)).length,
    published: mem.innovations.filter((i) => i.status === "PUBLISHED").length,
  };
}
export async function analytics() {
  const p = await prisma();
  if (p) {
    const [byCat, byStatus, claims] = await Promise.all([
      p.innovation.groupBy({ by: ["categoryId"], _count: true }),
      p.innovation.groupBy({ by: ["status"], _count: true }),
      p.claim.groupBy({ by: ["status"], _count: true }),
    ]);
    const cats = await p.category.findMany();
    const catName = Object.fromEntries(cats.map((c) => [c.id, c.name]));
    return {
      byCategory: byCat.map((r) => ({ name: catName[r.categoryId] ?? "?", count: r._count })),
      byStatus: byStatus.map((r) => ({ name: r.status, count: r._count })),
      claims: claims.map((r) => ({ name: r.status, count: r._count })),
    };
  }
  const byCategory = mem.categories.map((c) => ({ name: c.name, count: mem.innovations.filter((i) => i.categoryId === c.id).length })).filter((r) => r.count > 0);
  const countBy = (arr: string[]) => [...new Map(arr.map((s) => [s, arr.filter((x) => x === s).length])).entries()].map(([name, count]) => ({ name, count }));
  return { byCategory, byStatus: countBy(mem.innovations.map((i) => i.status)), claims: countBy(mem.claims.map((c) => c.status)) };
}
export async function userNotifications(userId: string) {
  const p = await prisma();
  if (p) {
    const rows = await p.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }).catch(() => []);
    return rows.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body ?? undefined, read: n.read, createdAt: n.createdAt.toISOString() }));
  }
  return clone(mem.notifications.filter((n) => n.userId === userId).slice(0, 20));
}
export async function recentActivity(limit = 8) {
  return clone(mem.audit.slice(0, limit));
}
