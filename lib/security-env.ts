const production = process.env.NODE_ENV === "production";

export function productionEnv(name: string, devFallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;

  if (production) {
    throw new Error(`${name} precisa estar configurado em produção.`);
  }

  return devFallback || "";
}

export function hasProductionEnv(name: string): boolean {
  return Boolean(productionEnv(name));
}
