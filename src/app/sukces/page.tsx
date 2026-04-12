"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SukcesPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <SukcesInner />
    </Suspense>
  );
}

function SukcesInner() {
  const [permStatus, setPermStatus] = useState<"idle" | "granted" | "denied" | "unsupported">("idle");
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") {
      setPermStatus("granted");
      subscribePush(sessionId);
    }
  }, [sessionId]);

  async function requestPermission() {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      setPermStatus("granted");
      await subscribePush(sessionId);
    } else {
      setPermStatus("denied");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-6xl mb-6">✅</p>
        <h1 className="text-3xl font-bold mb-4">Płatność zaakceptowana</h1>
        {sessionId && <p className="font-mono text-xs text-[var(--color-ink-faint)] mb-6">ID sesji: {sessionId}</p>}

        {permStatus === "idle" && (
          <>
            <p className="text-[var(--color-ink-muted)] mb-6">Zezwól na powiadomienia push, żebyśmy mogli Cię alertować o opóźnieniach.</p>
            <button onClick={requestPermission} className="btn-primary">Zezwól na powiadomienia</button>
          </>
        )}
        {permStatus === "granted" && (
          <p className="text-green-700 font-bold">✓ Monitoring aktywny. Dostaniesz powiadomienie jeśli opóźnienie zagrozi przesiadce.</p>
        )}
        {permStatus === "denied" && (
          <p className="text-[var(--color-ink-muted)]">Zablokowałeś powiadomienia. Włącz je w ustawieniach przeglądarki i odśwież stronę.</p>
        )}
        {permStatus === "unsupported" && (
          <p className="text-[var(--color-ink-muted)]">Ta przeglądarka nie obsługuje powiadomień push.</p>
        )}
      </div>
    </main>
  );
}

async function subscribePush(sessionId: string | null) {
  if (!sessionId) return;
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const keyBytes = urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!);
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer,
  });
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, subscription }),
  });
}

function urlB64ToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const normalized = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
