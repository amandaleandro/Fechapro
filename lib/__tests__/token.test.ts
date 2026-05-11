import { describe, expect, it } from "vitest";
import { createResetToken, decodeResetToken, verifyResetToken } from "../token";

const FAKE_HASH = "salt:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

describe("createResetToken", () => {
  it("retorna uma string base64url", () => {
    const token = createResetToken("user123", FAKE_HASH);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
  });
});

describe("decodeResetToken", () => {
  it("decodifica o userId corretamente", () => {
    const token = createResetToken("user123", FAKE_HASH);
    const decoded = decodeResetToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe("user123");
  });

  it("retorna null para token invalido", () => {
    expect(decodeResetToken("nao-e-um-token")).toBeNull();
    expect(decodeResetToken("")).toBeNull();
  });
});

describe("verifyResetToken", () => {
  it("valida token correto", () => {
    const token = createResetToken("user123", FAKE_HASH);
    expect(verifyResetToken(token, FAKE_HASH)).toBe(true);
  });

  it("rejeita token com hash diferente (senha ja alterada)", () => {
    const token = createResetToken("user123", FAKE_HASH);
    const otherHash = "salt:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    expect(verifyResetToken(token, otherHash)).toBe(false);
  });

  it("rejeita token adulterado", () => {
    const token = createResetToken("user123", FAKE_HASH);
    const tampered = token.slice(0, -4) + "XXXX";
    expect(verifyResetToken(tampered, FAKE_HASH)).toBe(false);
  });
});
