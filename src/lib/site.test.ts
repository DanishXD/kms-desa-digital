import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { siteUrl } from "./site";

const KEYS = ["NEXTAUTH_URL", "NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL"] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));
  for (const key of KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of KEYS) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("siteUrl", () => {
  it("memakai localhost saat tidak ada env", () => {
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("memakai NEXTAUTH_URL lebih dulu dan membuang slash akhir", () => {
    process.env.NEXTAUTH_URL = "https://kms.example.id/";
    process.env.NEXT_PUBLIC_SITE_URL = "https://public.example.id";
    expect(siteUrl()).toBe("https://kms.example.id");
  });

  it("memakai NEXT_PUBLIC_SITE_URL saat NEXTAUTH_URL kosong", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://public.example.id/";
    expect(siteUrl()).toBe("https://public.example.id");
  });

  it("memakai domain produksi Vercel dengan https", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "kms-desa.vercel.app";
    process.env.VERCEL_URL = "preview-123.vercel.app";
    expect(siteUrl()).toBe("https://kms-desa.vercel.app");
  });

  it("jatuh ke VERCEL_URL saat domain produksi tidak ada", () => {
    process.env.VERCEL_URL = "preview-123.vercel.app";
    expect(siteUrl()).toBe("https://preview-123.vercel.app");
  });

  it("env eksplisit mengalahkan env Vercel", () => {
    process.env.NEXTAUTH_URL = "https://kms.example.id";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "kms-desa.vercel.app";
    expect(siteUrl()).toBe("https://kms.example.id");
  });
});
