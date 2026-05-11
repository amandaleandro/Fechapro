import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../session";

describe("hashPassword / verifyPassword", () => {
  it("hash e verificacao sao consistentes", () => {
    const hash = hashPassword("minhasenha123");
    expect(verifyPassword("minhasenha123", hash)).toBe(true);
  });

  it("senha errada nao passa na verificacao", () => {
    const hash = hashPassword("minhasenha123");
    expect(verifyPassword("outrasenha", hash)).toBe(false);
  });

  it("hashes de mesma senha sao diferentes (salt aleatorio)", () => {
    const hash1 = hashPassword("senha");
    const hash2 = hashPassword("senha");
    expect(hash1).not.toBe(hash2);
    expect(verifyPassword("senha", hash1)).toBe(true);
    expect(verifyPassword("senha", hash2)).toBe(true);
  });

  it("retorna false para hash malformado", () => {
    expect(verifyPassword("senha", "sem-dois-pontos")).toBe(false);
  });
});
