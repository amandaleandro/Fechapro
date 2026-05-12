"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { isValidEmail } from "@/lib/validation";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !isValidEmail(email.trim())) {
      setError("Informe um e-mail valido.");
      return;
    }
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("Nao foi possivel enviar o e-mail agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-6 text-slate-950">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg sm:p-8">
        <div className="mb-6">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-700">
            Voltar
          </a>
        </div>

        <h1 className="mb-2 text-2xl font-bold">Esqueci minha senha</h1>
        <p className="mb-6 text-sm text-slate-500">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        {sent ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Se esse e-mail estiver cadastrado, voce recebera as instrucoes em breve.
            Verifique sua caixa de entrada e a pasta de spam.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="email">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="min-h-11 w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar link de redefinicao"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Lembrou a senha?{" "}
              <a href="/login" className="font-medium text-slate-950 hover:underline">
                Entrar
              </a>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
