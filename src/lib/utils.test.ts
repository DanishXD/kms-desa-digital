import { describe, expect, it } from "vitest";
import { isObjectId } from "./utils";

describe("isObjectId", () => {
  it("menerima ObjectId 24 hex", () => {
    expect(isObjectId("6affe49bd2ab9b078c7c5ce9")).toBe(true);
    expect(isObjectId("6AFFE49BD2AB9B078C7C5CE9")).toBe(true);
  });

  it("menolak slug inovasi", () => {
    // Nilai nyata dari URL /innovations/[slug] yang dulu memicu P2023.
    expect(isObjectId("posyandu-antri")).toBe(false);
    expect(isObjectId("suratdesa-mandiri")).toBe(false);
    expect(isObjectId("embung-monitor")).toBe(false);
    expect(isObjectId("bumdes-mart-digital")).toBe(false);
  });

  it("menolak id pendek, id in-memory, dan string kosong", () => {
    expect(isObjectId("i_seed_0")).toBe(false);
    expect(isObjectId("6affe49bd2ab9b078c7c5ce")).toBe(false);
    expect(isObjectId("6affe49bd2ab9b078c7c5ce99")).toBe(false);
    expect(isObjectId("zzzzzzzzzzzzzzzzzzzzzzzz")).toBe(false);
    expect(isObjectId("")).toBe(false);
  });
});
