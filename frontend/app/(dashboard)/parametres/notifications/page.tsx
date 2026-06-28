"use client";

import { useState, useEffect } from "react";
import { requestNotificationPermission, subscribeToPush } from "@/lib/push";
import { api } from "@/lib/api";
import { Bell, CheckCircle, XCircle, Loader2, Send, BellOff } from "lucide-react";

export default function NotificationsParamPage() {
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [pushSubscription, setPushSubscription] = useState<PushSubscriptionJSON | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBrowserEnabled("Notification" in window && Notification.permission === "granted");
      const saved = localStorage.getItem("pc_push_subscribed");
      if (saved === "true") setSubscribed(true);
    }
  }, []);

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleEnableBrowser = async () => {
    setPermissionLoading(true);
    try {
      const granted = await requestNotificationPermission();
      setBrowserEnabled(granted);
      if (granted) showMsg("success", "Notifications activées");
      else showMsg("error", "Permission refusée");
    } catch {
      showMsg("error", "Erreur lors de la demande de permission");
    } finally {
      setPermissionLoading(false);
    }
  };

  const handleTest = async () => {
    setTestLoading(true);
    try {
      if (!("Notification" in window)) { showMsg("error", "Notifications non supportées"); return; }
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("PharmaCloud", {
          body: "Notification de test — tout fonctionne !",
          icon: "/favicon.ico",
        });
        showMsg("success", "Notification de test envoyée");
      } else {
        showMsg("error", "Permission non accordée");
      }
    } catch {
      showMsg("error", "Erreur d'envoi");
    } finally {
      setTestLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribeLoading(true);
    try {
      await subscribeToPush();
      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        localStorage.setItem("pc_push_subscribed", "true");
        setSubscribed(true);
        showMsg("success", "Abonnement enregistré (mode démo — pas de clé VAPID)");
        setSubscribeLoading(false);
        return;
      }
      const subJSON = sub.toJSON();
      if (!subJSON.endpoint) { showMsg("error", "Abonnement invalide"); return; }
      await api.post("/push/subscribe", {
        endpoint: subJSON.endpoint,
        keys: {
          p256dh: (subJSON.keys as Record<string, string>)?.p256dh || "",
          auth: (subJSON.keys as Record<string, string>)?.auth || "",
        },
      });
      setSubscribed(true);
      setPushSubscription(subJSON);
      localStorage.setItem("pc_push_subscribed", "true");
      showMsg("success", "Abonnement réussi");
    } catch {
      showMsg("error", "Erreur d'abonnement");
    } finally {
      setSubscribeLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setUnsubscribing(true);
    try {
      await api.post("/push/unsubscribe");
      setSubscribed(false);
      setPushSubscription(null);
      localStorage.removeItem("pc_push_subscribed");
      showMsg("success", "Désabonnement réussi");
    } catch {
      showMsg("error", "Erreur de désabonnement");
    } finally {
      setUnsubscribing(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications push</h1>
        <p className="mt-1 text-sm text-gray-500">Gérez vos alertes navigateur et abonnements push</p>
      </div>

      {msg && (
        <div className={`mb-6 flex items-center gap-2 rounded-lg border p-4 text-sm ${
          msg.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {msg.type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {msg.text}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Bell size={20} className="text-pharma-600" />
          <h2 className="text-lg font-semibold text-gray-900">Notifications navigateur</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Activer les notifications navigateur</p>
              <p className="text-xs text-gray-500 mt-0.5">Autorisez l'envoi de notifications sur votre navigateur</p>
            </div>
            <button
              onClick={handleEnableBrowser}
              disabled={permissionLoading || browserEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                browserEnabled ? "bg-pharma-600" : "bg-gray-300"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                browserEnabled ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          <button onClick={handleTest} disabled={testLoading || !browserEnabled}
            className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50">
            {testLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Tester
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Bell size={20} className="text-pharma-600" />
          <h2 className="text-lg font-semibold text-gray-900">S'abonner</h2>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Abonnez-vous pour recevoir des notifications push même lorsque l'application est fermée.
        </p>

        <button onClick={handleSubscribe} disabled={subscribeLoading || subscribed}
          className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50">
          {subscribeLoading ? <Loader2 size={16} className="animate-spin" /> : null}
          {subscribeLoading ? "Abonnement..." : "S'abonner"}
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Bell size={20} className="text-pharma-600" />
          <h2 className="text-lg font-semibold text-gray-900">Abonnement actuel</h2>
        </div>

        {subscribed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle size={16} /> Abonnement actif
            </div>
            {pushSubscription?.endpoint && (
              <p className="text-xs text-gray-400 break-all">Endpoint: {pushSubscription.endpoint.slice(0, 60)}...</p>
            )}
            <button onClick={handleUnsubscribe} disabled={unsubscribing}
              className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
              {unsubscribing ? <Loader2 size={16} className="animate-spin" /> : <BellOff size={16} />}
              {unsubscribing ? "Désabonnement..." : "Se désabonner"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <XCircle size={16} /> Aucun abonnement actif
          </div>
        )}
      </div>
    </div>
  );
}
