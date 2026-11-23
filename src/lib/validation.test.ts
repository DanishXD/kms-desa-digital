import { describe, expect, it } from "vitest";
import { registerSchema } from "./validation";

const base = { name: "Warga Desa", email: "warga@desa.id", role: "VILLAGE" as const };

describe("registerSchema", () => {
  it("menolak kata sandi di bawah 8 karakter", () => {
    const parsed = registerSchema.safeParse({ ...base, password: "1234567" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0]?.message).toBe("Kata sandi minimal 8 karakter");
  });

  it("menerima kata sandi 8 karakter", () => {
    expect(registerSchema.safeParse({ ...base, password: "12345678" }).success).toBe(true);
  });

  it("menolak peran di luar INNOVATOR/VILLAGE", () => {
    expect(registerSchema.safeParse({ ...base, password: "12345678", role: "ADMIN" }).success).toBe(false);
  });
});
