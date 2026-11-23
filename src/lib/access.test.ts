import { describe, expect, it } from "vitest";
import { canListAllInnovations, claimFilterFor } from "./access";

describe("claimFilterFor", () => {
  it("ADMIN melihat semua klaim", () => {
    expect(claimFilterFor({ role: "ADMIN", villageId: "v_1", innovatorId: "n_1" })).toEqual({ all: true });
  });

  it("VILLAGE hanya melihat klaim desanya", () => {
    expect(claimFilterFor({ role: "VILLAGE", villageId: "v_1" })).toEqual({ all: false, villageId: "v_1" });
  });

  it("INNOVATOR hanya melihat klaim untuk inovasinya", () => {
    expect(claimFilterFor({ role: "INNOVATOR", innovatorId: "n_1" })).toEqual({ all: false, innovatorId: "n_1" });
  });

  it("KEMENTERIAN bersifat read-only tanpa scope klaim", () => {
    expect(claimFilterFor({ role: "KEMENTERIAN" })).toEqual({ all: false });
  });

  it("peran tak dikenal tidak mendapat scope", () => {
    expect(claimFilterFor({ role: "UNKNOWN", villageId: "v_1" })).toEqual({ all: false });
  });
});

describe("canListAllInnovations", () => {
  it("hanya ADMIN yang boleh melihat seluruh katalog", () => {
    expect(canListAllInnovations("ADMIN")).toBe(true);
    expect(canListAllInnovations("INNOVATOR")).toBe(false);
    expect(canListAllInnovations("VILLAGE")).toBe(false);
    expect(canListAllInnovations("KEMENTERIAN")).toBe(false);
    expect(canListAllInnovations(undefined)).toBe(false);
  });
});
