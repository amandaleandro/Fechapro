"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

type Props = { onNotice: (message: string | null) => void };

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushNotificationPanel({ onNotice }: Props) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canUsePush = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(canUsePush);
    if (canUsePush) setPermission(Notification.permission);
  }, []);

  async function enablePush() {
    if (!supported || loading) return;
    setLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== "granted") {
        onNotice("Notificações bloqueadas no navegador. Ative a permissão para receber alertas.");
        return;
      }

      const keyResp = await fetch("/api/push/vapid-key");
      const keyJson = await keyResp.json();
      if (!keyJson.enabled || !keyJson.publicKey) {
        onNotice("Configure NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY para ativar push.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey),
        }));

      await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      onNotice("Notificações push ativadas para propostas visualizadas, aceitas, recusadas e pagas.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Não foi possível ativar notificações push.");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
      <div>
        <p className="text-xs font-black uppercase text-blue-700">Notificações</p>
        <h2 className="mt-1 text-lg font-black">Alertas push de propostas</h2>
        <p className="mt-1 text-sm font-bold text-slate-500">Receba aviso quando uma proposta for visualizada, aceita, recusada ou paga.</p>
      </div>
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading || permission === "granted"}
        type="button"
        onClick={enablePush}
      >
        <Bell size={18} />
        {permission === "granted" ? "Push ativado" : loading ? "Ativando..." : "Ativar push"}
      </button>
    </section>
  );
}
