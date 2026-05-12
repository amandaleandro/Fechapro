"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

function RedefinirSenhaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("As senhas nao coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Nao foi possivel redefinir a senha.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Nao foi possivel redefinir a senha agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        Link invalido. Solicite um novo link de redefinicao de senha.
      </p>
    );
  }

  if (done) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Senha redefinida com sucesso! Redirecionando para o login...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordField
        id="password"
        label="Nova senha"
        placeholder="Minimo 8 caracteres"
        value={password}
        onChange={setPassword}
      />
      <PasswordField
        id="confirm"
        label="Confirmar nova senha"
        placeholder="Repita a nova senha"
        value={confirm}
        onChange={setConfirm}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="min-h-11 w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}

function PasswordField({
  id,
  label,
  onChange,
  placeholder,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type="password"
          required
          minLength={id === "password" ? 8 : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-6 text-slate-950">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg sm:p-8">
        <div className="mb-6">
          <a href="/login" className="text-sm text-slate-500 hover:text-slate-700">
            Voltar ao login
          </a>
        </div>
        <h1 className="mb-2 text-2xl font-bold">Redefinir senha</h1>
        <p className="mb-6 text-sm text-slate-500">Escolha uma nova senha para sua conta.</p>
        <Suspense fallback={<p className="text-sm text-slate-400">Carregando...</p>}>
          <RedefinirSenhaForm />
        </Suspense>
      </div>
    </main>
  );
}
