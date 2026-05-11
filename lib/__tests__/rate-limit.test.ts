import { beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "../rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("permite requisicoes dentro do limite", () => {
    const key = `test:${Math.random()}`;
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
  });

  it("bloqueia apos atingir o limite", () => {
    const key = `test:${Math.random()}`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    expect(rateLimit(key, 2, 60_000)).toBe(false);
  });

  it("reseta apos a janela de tempo expirar", () => {
    const key = `test:${Math.random()}`;
    rateLimit(key, 1, 60_000);
    expect(rateLimit(key, 1, 60_000)).toBe(false);

    vi.advanceTimersByTime(61_000);
    expect(rateLimit(key, 1, 60_000)).toBe(true);
  });

  it("chaves diferentes sao independentes", () => {
    const key1 = `test:a${Math.random()}`;
    const key2 = `test:b${Math.random()}`;
    rateLimit(key1, 1, 60_000);
    rateLimit(key1, 1, 60_000);
    expect(rateLimit(key2, 1, 60_000)).toBe(true);
  });
});
