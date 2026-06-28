"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pill, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.post<{ access_token: string; refresh_token: string }>("/auth/login", { email, password });
      api.setToken(data.access_token);
      router.push("/caisse");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pharma-500 to-pharma-600 shadow-lg mb-4">
          <Pill size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
        <p className="mt-1 text-sm text-gray-500">Connectez-vous à votre espace pharmacie</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none transition-all"
            placeholder="pharmacien@exemple.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none transition-all"
            placeholder="••••••••"
            required
          />
        </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pharma-500 to-pharma-600 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-pharma-600 hover:to-pharma-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Connexion..." : "Se connecter"}
          </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <Link href="/register" className="font-medium text-pharma-600 hover:text-pharma-700">
          Créer un compte
        </Link>
        <span className="mx-2">·</span>
        <a href="#" className="font-medium text-pharma-600 hover:text-pharma-700">
          Mot de passe oublié
        </a>
      </div>
    </div>
  );
}
