"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Plus, X, Loader2, Download } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  vat: number;
  customer_tin: string;
  created_at: string;
  status: string;
}

const statusColors: Record<string, string> = {
  generated: "bg-blue-100 text-blue-700",
  sent: "bg-green-100 text-green-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function FacturationPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ sale_reference: "", customer_tin: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<Invoice[]>("/invoicing/invoices");
      setInvoices(data);
    } catch {
      setError("Impossible de charger les factures.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.post("/invoicing/generate", {
        sale_id: form.sale_reference,
        customer_tin: form.customer_tin,
      });
      setForm({ sale_reference: "", customer_tin: "" });
      setShowForm(false);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur de génération");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturation électronique</h1>
          <p className="mt-1 text-sm text-gray-500">Génération et suivi des factures électroniques</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700">
          <Plus size={18} /> Générer une facture
        </button>
      </div>

      {showForm && (
        <form onSubmit={generate} className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Nouvelle facture</h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Référence vente</label>
              <input required value={form.sale_reference} onChange={(e) => setForm({ ...form, sale_reference: e.target.value })}
                placeholder="Numéro de la vente"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIF Client</label>
              <input required value={form.customer_tin} onChange={(e) => setForm({ ...form, customer_tin: e.target.value })}
                placeholder="Numéro d'identification fiscale"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={generating}
              className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm text-white hover:bg-pharma-700 disabled:opacity-50">
              {generating && <Loader2 size={16} className="animate-spin" />}
              {generating ? "Génération..." : "Générer"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Annuler</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-pharma-600" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-red-500">{error}</p>
          <button onClick={load} className="mt-4 text-sm text-pharma-600 hover:underline">Réessayer</button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <FileText size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">Aucune facture générée</p>
          <p className="text-sm text-gray-400">Cliquez sur "Générer une facture" pour commencer</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3">Numéro facture</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">TVA</th>
                  <th className="px-4 py-3">Client TIN</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_number || inv.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{formatCurrency(inv.amount)}</td>
                    <td className="px-4 py-3">{formatCurrency(inv.vat)}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.customer_tin}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(inv.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[inv.status] || "bg-gray-100 text-gray-700"}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
