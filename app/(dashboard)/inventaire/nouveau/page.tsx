"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";

export default function NouvelInventairePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "full", notes: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.post<{ id: string }>("/inventories/", form);
      router.push(`/inventaire/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvel inventaire</h1>
          <p className="mt-1 text-sm text-gray-500">Lancer un comptage de stock</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Type d&apos;inventaire</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type *</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none">
                <option value="full">Inventaire complet</option>
                <option value="partial">Inventaire partiel</option>
                <option value="rotation">Inventaire tournant</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={4}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" placeholder="Observations facultatives..." />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-pharma-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50">
            <Save size={18} /> {saving ? "Création..." : "Lancer l&apos;inventaire"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
