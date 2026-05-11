import { describe, expect, it } from "vitest";
import { slugify } from "../api";

describe("slugify", () => {
  it("converte para lowercase e remove acentos", () => {
    const slug = slugify("João da Silva");
    expect(slug).toMatch(/^joao-da-silva-/);
  });

  it("remove caracteres especiais", () => {
    const slug = slugify("Design & Web!!!");
    expect(slug).toMatch(/^design-web-/);
  });

  it("usa 'proposta' como base quando input e vazio", () => {
    const slug = slugify("");
    expect(slug).toMatch(/^proposta-/);
  });

  it("gera slugs diferentes a cada chamada (entropia)", () => {
    const slug1 = slugify("Teste");
    const slug2 = slugify("Teste");
    expect(slug1).not.toBe(slug2);
  });

  it("slug tem sufixo aleatorio de exatamente 12 chars base64url", () => {
    const slug = slugify("x");
    // base64url pode conter "-", entao nao usar split("-")
    expect(slug).toMatch(/^x-[A-Za-z0-9_-]{12}$/);
  });
});
