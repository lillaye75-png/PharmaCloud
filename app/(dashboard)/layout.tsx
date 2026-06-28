"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import AiChatbot from "@/components/ai/chatbot";
import { requestNotificationPermission } from "@/lib/push";
import { initLocale } from "@/lib/i18n";
import { api } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initLocale();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (Notification.permission === "default") {
      requestNotificationPermission();
    }
    if (!pathname.startsWith("/parametres/wizard") && typeof window !== "undefined") {
      const wizardDone = sessionStorage.getItem("wizard_checked");
      if (!wizardDone) {
        api.get<{ completed: boolean }>("/wizard/status").then((status) => {
          sessionStorage.setItem("wizard_checked", "1");
          if (!status.completed) router.push("/parametres/wizard");
        }).catch(() => {});
      }
    }
  }, [router, pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-64 min-h-screen p-6 pt-16 md:pt-6">
        {children}
      </main>
      <AiChatbot />
    </div>
  );
}
