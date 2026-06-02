"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, Mail, MessageCircle, Sparkles, User, Wrench, Zap } from "lucide-react";
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

const benefits = [
  { icon: FileText, text: "Proposta em link e PDF profissional" },
  { icon: CheckCircle2, text: "Cliente assina online, sem complicação" },
  { icon: Sparkles, text: "Personalize com sua marca e preços" },
  { icon: Zap, text: "Monte e envie propostas em minutos" },
];

export default function InterestPage() {
  const [form, setForm] = useState<LeadForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof LeadForm>(key: K, value: LeadForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitInterest(event: { preventDefault(): void }) {
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
    <main className="min-h-screen bg-white text-slate-950">
      <nav className="border-b border-black/8 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="grid h-11 w-36 place-items-center rounded-lg bg-slate-950 px-3" href="/">
            <Image alt="FechaPro" className="h-8 w-full object-contain" src="/brand/logofechapro.png" width={144} height={36} />
          </Link>
          <Link
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-black/10 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            href="/#planos"
          >
            Ver planos
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_480px] lg:items-start lg:gap-16 lg:py-20 lg:px-8">
        <div className="grid gap-8 lg:sticky lg:top-24">
          <div className="grid gap-4">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700 ring-1 ring-green-200">
              <Sparkles size={11} />
              Avaliação gratuita
            </span>

            <h1 className="text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Feche mais negócios com{" "}
              <span className="text-green-600">propostas profissionais</span>
            </h1>

            <p className="max-w-lg text-lg leading-relaxed text-slate-500">
              Deixe seus dados e receba orientação personalizada sobre planos, implantação e como o FechaPro se encaixa no seu negócio.
            </p>
          </div>

          <ul className="grid gap-3">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-slate-700">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-green-50 text-green-600">
                  <Icon size={15} />
                </span>
                <span className="text-sm font-semibold">{text}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 rounded-xl border border-black/8 bg-slate-50 p-4">
            <div className="flex -space-x-2">
              {["A", "B", "C"].map((letter) => (
                <span key={letter} className="grid size-8 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-green-400 to-emerald-600 text-xs font-black text-white">
                  {letter}
                </span>
              ))}
            </div>
            <p className="text-sm font-semibold text-slate-600">
              Freelancers e agências já usam o FechaPro no dia a dia
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-black/8 bg-white shadow-2xl shadow-slate-900/8 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400" />

          {sent ? (
            <div className="grid gap-6 p-8 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 size={32} />
              </span>
              <div>
                <h2 className="text-2xl font-black">Interesse registrado!</h2>
                <p className="mx-auto mt-2 max-w-sm text-slate-500 leading-6">
                  Obrigado! Entraremos em contato em breve com informações sobre planos e implantação.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 font-bold text-white transition-colors hover:bg-green-700"
                  href="/#planos"
                >
                  Ver planos e assinar
                  <ArrowRight size={16} />
                </Link>
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-black/10 px-5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  type="button"
                  onClick={() => setSent(false)}
                >
                  Cadastrar outra pessoa
                </button>
              </div>
            </div>
          ) : (
            <form className="grid gap-5 p-6 sm:p-8" onSubmit={submitInterest}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-green-700">Cadastro de interesse</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">Informe seus dados</h2>
              </div>

              {error ? (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
                  <span className="mt-0.5 text-rose-500">!</span>
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4">
                <FormField autoComplete="name" icon={User} label="Nome" maxLength={80} required value={form.name} onChange={(value) => updateField("name", value)} />
                <FormField autoComplete="email" icon={Mail} label="E-mail" required type="email" value={form.email} onChange={(value) => updateField("email", value)} />
                <FormField autoComplete="tel" icon={MessageCircle} label="WhatsApp (opcional)" maxLength={20} value={form.whatsapp} onChange={(value) => updateField("whatsapp", value)} />

                <label className="grid gap-1.5">
                  <span className="text-sm font-bold text-slate-700">Tipo de negócio</span>
                  <input
                    className="min-h-11 rounded-xl border border-black/10 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-shadow focus:border-green-400 focus:ring-2 focus:ring-green-100"
                    maxLength={80}
                    placeholder="Ex: designer, social media, arquitetura"
                    value={form.businessType}
                    onChange={(event) => updateField("businessType", event.target.value)}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-bold text-slate-700">Principal interesse</span>
                  <select
                    className="min-h-11 rounded-xl border border-black/10 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-shadow focus:border-green-400 focus:ring-2 focus:ring-green-100"
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

                <label className="grid gap-1.5">
                  <span className="text-sm font-bold text-slate-700">Mensagem <span className="font-normal text-slate-400">(opcional)</span></span>
                  <textarea
                    className="min-h-24 resize-none rounded-xl border border-black/10 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition-shadow focus:border-green-400 focus:ring-2 focus:ring-green-100"
                    maxLength={600}
                    placeholder="Conte como você envia propostas hoje ou qual plano quer entender melhor."
                    value={form.message}
                    onChange={(event) => updateField("message", event.target.value)}
                  />
                </label>
              </div>

              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? "Enviando..." : "Registrar interesse"}
                <ArrowRight size={17} />
              </button>

              <p className="text-center text-xs text-slate-400">
                Sem spam. Seus dados são usados apenas para retorno comercial.
              </p>
            </form>
          )}
        </section>
      </div>
    </main>
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
    <label className="grid gap-1.5">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <span className="flex min-h-11 items-center gap-3 rounded-xl border border-black/10 bg-slate-50 px-3.5 transition-shadow focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100">
        <Icon className="shrink-0 text-slate-400" size={16} />
        <input
          className="min-h-10 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          autoComplete={autoComplete}
          maxLength={maxLength}
          required={required}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
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
