"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MessageCircle, Sparkles, User, Wrench } from "lucide-react";
import { isValidEmail, isValidPhone } from "@/lib/validation";

type LeadForm = {
  businessType: string;
  email: string;
  mainNeed: string;
  message: string;
  name: string;
  whatsapp: string;
};

const initialForm: LeadForm = {
  businessType: "",
  email: "",
  mainNeed: "",
  message: "",
  name: "",
  whatsapp: "",
};

const needs = [
  "Quero testar antes de assinar",
  "Preciso organizar propostas",
  "Quero vender com link e PDF",
  "Tenho interesse no plano com site",
];

export default function InterestPage() {
  const [form, setForm] = useState<LeadForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof LeadForm>(key: K, value: LeadForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitInterest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim()) {
      setError("Informe nome e e-mail para registrar seu interesse.");
      return;
    }

    if (!isValidEmail(form.email.trim())) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (form.whatsapp.trim() && !isValidPhone(form.whatsapp.trim())) {
      setError("Informe um WhatsApp válido com DDD.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setSent(true);
      setForm(initialForm);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível enviar agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="grid h-12 w-40 place-items-center rounded-lg bg-slate-950 px-3" href="/">
            <Image alt="FechaPro" className="h-9 w-full object-contain" src="/brand/logofechapro.png" width={144} height={36} />
          </Link>
          <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 px-4 text-sm font-black" href="/cadastro">
            Criar conta
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <section className="mx-auto grid min-h-[calc(100vh-81px)] w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8">
        <div className="grid gap-6">
          <div>
            <p className="inline-flex rounded-lg bg-green-100 px-3 py-2 text-xs font-black uppercase text-green-800">
              Lista de interesse
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
              Quer usar o FechaPro no seu negócio?
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Deixe seus dados para receber prioridade em novidades, testes e condições de entrada. Ideal para prestadores que querem propostas mais bonitas, organizadas e fáceis de aceitar.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <InfoPill icon={Sparkles} label="Propostas" value="Link + PDF" />
            <InfoPill icon={CheckCircle2} label="Cliente" value="Aceite online" />
            <InfoPill icon={Wrench} label="Planos" value="Com ou sem site" />
          </div>
        </div>

        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 sm:p-6">
          {sent ? (
            <div className="grid min-h-[440px] content-center gap-4 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 size={32} />
              </span>
              <div>
                <h2 className="text-3xl font-black">Interesse registrado.</h2>
                <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
                  Obrigado. Seus dados ficaram salvos e podemos te chamar quando houver novidade ou prioridade de acesso.
                </p>
              </div>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <button className="inline-flex min-h-11 items-center justify-center rounded-lg border border-black/10 px-4 font-black" type="button" onClick={() => setSent(false)}>
                  Cadastrar outra pessoa
                </button>
                <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white" href="/cadastro">
                  Criar conta agora
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={submitInterest}>
              <div>
                <p className="text-xs font-black uppercase text-blue-700">Cadastro de interesse</p>
                <h2 className="text-2xl font-black leading-tight">Conte um pouco sobre você</h2>
              </div>

              {error ? (
                <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-3 text-sm font-bold text-rose-900">
                  {error}
                </div>
              ) : null}

              <FormField autoComplete="name" icon={User} label="Nome" maxLength={80} required value={form.name} onChange={(value) => updateField("name", value)} />
              <FormField autoComplete="email" icon={Mail} label="E-mail" required type="email" value={form.email} onChange={(value) => updateField("email", value)} />
              <FormField autoComplete="tel" icon={MessageCircle} label="WhatsApp" maxLength={20} value={form.whatsapp} onChange={(value) => updateField("whatsapp", value)} />

              <label className="grid gap-2 text-sm font-extrabold text-slate-600">
                Tipo de negócio
                <input
                  className="min-h-12 rounded-lg border border-black/10 bg-slate-50 px-3 text-slate-900 outline-green-700"
                  maxLength={80}
                  placeholder="Ex: designer, social media, arquitetura"
                  value={form.businessType}
                  onChange={(event) => updateField("businessType", event.target.value)}
                />
              </label>

              <label className="grid gap-2 text-sm font-extrabold text-slate-600">
                Principal interesse
                <select
                  className="min-h-12 rounded-lg border border-black/10 bg-slate-50 px-3 text-slate-900 outline-green-700"
                  value={form.mainNeed}
                  onChange={(event) => updateField("mainNeed", event.target.value)}
                >
                  <option value="">Selecione uma opção</option>
                  {needs.map((need) => (
                    <option key={need} value={need}>
                      {need}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-extrabold text-slate-600">
                Mensagem
                <textarea
                  className="min-h-28 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700"
                  maxLength={600}
                  placeholder="Conte o que você gostaria de resolver com o FechaPro."
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                />
              </label>

              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">
                {loading ? "Enviando..." : "Registrar interesse"}
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}

function InfoPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/5">
      <Icon className="text-green-700" size={22} />
      <p className="mt-3 text-xs font-black uppercase text-slate-500">{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function FormField({
  autoComplete,
  icon: Icon,
  label,
  maxLength,
  onChange,
  required = false,
  type = "text",
  value,
}: {
  autoComplete?: string;
  icon: React.ElementType;
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-slate-600">
      {label}
      <span className="flex min-h-12 items-center gap-3 rounded-lg border border-black/10 bg-slate-50 px-3 focus-within:outline focus-within:outline-3 focus-within:outline-green-700/20">
        <Icon className="shrink-0 text-slate-500" size={18} />
        <input className="min-h-11 flex-1 bg-transparent text-slate-900 outline-none" autoComplete={autoComplete} maxLength={maxLength} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

async function readApiError(response: Response) {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return data.error || data.message || "Não foi possível enviar agora.";
  } catch {
    return "Não foi possível enviar agora.";
  }
}
