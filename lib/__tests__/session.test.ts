import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../session";

describe("hashPassword / verifyPassword", () => {
  it("hash e verificacao sao consistentes", async () => {
    const hash = await hashPassword("minhasenha123");
    expect(await verifyPassword("minhasenha123", hash)).toBe(true);
  });

  it("senha errada nao passa na verificacao", async () => {
    const hash = await hashPassword("minhasenha123");
    expect(await verifyPassword("outrasenha", hash)).toBe(false);
  });

  it("hashes de mesma senha sao diferentes (salt aleatorio)", async () => {
    const hash1 = await hashPassword("senha");
    const hash2 = await hashPassword("senha");
    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword("senha", hash1)).toBe(true);
    expect(await verifyPassword("senha", hash2)).toBe(true);
  });

  it("retorna false para hash malformado", async () => {
    expect(await verifyPassword("senha", "sem-dois-pontos")).toBe(false);
  });
});
