import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").max(80),
  email: z.string().email("Email tidak valid").max(120),
  password: z.string().min(6, "Kata sandi minimal 6 karakter").max(72),
  role: z.enum(["INNOVATOR", "VILLAGE"]),
});

export const innovationSchema = z.object({
  title: z.string().min(5).max(120),
  shortDescription: z.string().min(10).max(300),
  description: z.string().min(30),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  problem: z.string().optional().default(""),
  solution: z.string().optional().default(""),
  benefits: z.string().optional().default(""),
  implementation: z.string().optional().default(""),
  technology: z.string().optional().default(""),
  requirements: z.string().optional().default(""),
  estimatedCost: z.string().optional().default(""),
  impact: z.string().optional().default(""),
});

export const claimSchema = z.object({
  innovationId: z.string().min(1),
  message: z.string().min(10, "Ceritakan kebutuhan desa minimal 10 karakter").max(2000),
});

export const assessmentSubmitSchema = z.object({
  villageName: z.string().min(3).max(80).optional(),
  answers: z.array(z.object({ questionId: z.string(), value: z.number().min(0).max(4) })).min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type InnovationInput = z.infer<typeof innovationSchema>;
