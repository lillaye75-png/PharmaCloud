"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Smartphone, CreditCard, Settings, CheckCircle, XCircle, Clock, Plus, X } from "lucide-react";

const methodConfig: Record<string, { name: string; icon: string; color: string }> = {
  orange_money: { name: "Orange Money", icon: "📱", color: "bg-orange-100 text-orange-700" },
  wave: { name: "Wave", icon: "🌊", color: "bg-blue-100 text-blue-700" },
  free_money: { name: "Free Money", icon: "📱", color: "bg-red-100 text-red-700" },
  card: { name: "Carte bancaire", icon: "💳", color: "bg-violet-100 text-violet-700" },
};

const statusBadge: Record<string, { label: string; class: string; icon: any }> = {
  pending: { label: "En attente", class: "bg-yellow-100 text-yellow-700", icon: Clock },
  success: { label: "Réussi", class: "bg-green-100 text-green-700", icon: CheckCircle },
  failed: { label: "Échoué", class: "bg-red-100 text-red-700", icon: XCircle },
  cancelled: { label: "Annulé", class: "bg-gray-100 text-gray-500", icon: XCircle },
};

const paymentConfigFields: Record<string, { key: string; label: string; type: string }[]> = {
  orange_money: [
    { key: "om_client_id", label: "Client ID", type: "text" },
    { key: "om_client_secret", label: "Client Secret", type: "password" },
    { key: "om_merchant_key", label: "Merchant Key", type: "password" },
  ],
  wave: [
    { key: "wave_api_key", label: "API Key", type: "password" },
  ],
};

export default function PaiementsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configMethod, setConfigMethod] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ amount: 1000, method: "orange_money", phone: "", customer_name: "" });

  const fetchTransactions = () => {
    api.get<{ transactions: any[] }>("/payments/transactions")
      .then((d) => setTransactions(d.transactions))
      .catch(() => {});
  };

  useEffect(() => {
    api.get<{ methods: any[] }>("/payments/methods").then((d) => setMethods(d.methods)).catch(() => {});
    fetchTransactions();
  }, []);

  const initiatePayment = async () => {
    setLoading(true);
    try {
      await api.post("/payments/initiate", form);
      setShowModal(false);
      setForm({ amount: 1000, method: "orange_money", phone: "", customer_name: "" });
      fetchTransactions();
    } catch (e) {
      alert("Erreur lors du paiement");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="mt-1 text-sm text-gray-500">Moyens de paiement et transactions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700"
        >
          <Plus size={18} /> Nouveau paiement
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Moyens de paiement disponibles</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {methods.map((m) => {
            const cfg = methodConfig[m.id] || { name: m.name, icon: "💳", color: "bg-gray-100 text-gray-700" };
            return (
              <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{cfg.name}</h3>
                <p className="mt-1 text-xs text-gray-400">Paiement mobile</p>
                <button onClick={() => { setConfigMethod(m.id); setConfigForm(JSON.parse(localStorage.getItem(`pc_pay_config_${m.id}`) || "{}")); setShowConfigModal(true); }} className="mt-3 flex items-center gap-1 text-xs font-medium text-pharma-600 hover:text-pharma-700">
                  <Settings size={12} /> Configurer
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transactions récentes</h2>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard size={40} className="mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">Aucune transaction pour le moment</p>
              <p className="text-sm text-gray-400">Les transactions apparaîtront après les paiements</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Méthode</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t) => {
                  const badge = statusBadge[t.status] || statusBadge.pending;
                  const Icon = badge.icon;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 font-semibold">{t.amount.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3 capitalize">{t.method.replace("_", " ")}</td>
                      <td className="px-4 py-3">{t.customer_name || t.phone || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.class}`}>
                          <Icon size={12} /> {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showConfigModal && configMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Configurer {methodConfig[configMethod]?.name || configMethod}</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {(paymentConfigFields[configMethod] || []).map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={configForm[field.key] || ""}
                    onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  localStorage.setItem(`pc_pay_config_${configMethod}`, JSON.stringify(configForm));
                  setShowConfigModal(false);
                }}
                className="w-full rounded-lg bg-pharma-600 py-2.5 text-sm font-medium text-white hover:bg-pharma-700"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Nouveau paiement</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Méthode</label>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {methods.map((m) => (
                    <option key={m.id} value={m.id}>{methodConfig[m.id]?.name || m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+221 77 XXX XX XX"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du client</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <button
                onClick={initiatePayment}
                disabled={loading}
                className="w-full rounded-lg bg-pharma-600 py-2.5 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50"
              >
                {loading ? "Traitement..." : "Payer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
