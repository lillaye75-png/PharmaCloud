"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2, Wallet } from "lucide-react";

interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
}

const CATEGORIES = ["Loyer", "Salaires", "Fournitures", "Électricité", "Eau", "Transport", "Marketing", "Impôts", "Entretien", "Autre"];

export default function DepensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "Fournitures", amount: 0, description: "" });

  const load = useCallback(async () => {
    try { const data = await api.get<Expense[]>("/expenses/"); setExpenses(data); }
    catch { setExpenses([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/expenses/", form);
      setForm({ category: "Fournitures", amount: 0, description: "" });
      setShowForm(false);
      load();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Erreur"); }
  };

  const remove = async (id: string) => {
    try { await api.delete(`/expenses/${id}`); load(); }
    catch { alert("Erreur"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dépenses</h1>
          <p className="mt-1 text-sm text-gray-500">Suivi des dépenses de la pharmacie</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700">
          <Plus size={18} /> Nouvelle dépense
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-red-100 p-3 text-red-600"><Wallet size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Total dépenses</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Ajouter une dépense</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input required type="number" placeholder="Montant" value={form.amount || ""} onChange={(e) => setForm({...form, amount: Number(e.target.value)})}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            <input placeholder="Description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
              className="sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-pharma-600 px-4 py-2 text-sm text-white hover:bg-pharma-700">Enregistrer</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Annuler</button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{formatDate(e.date)}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">{e.category}</span></td>
                <td className="px-4 py-3 text-gray-600">{e.description || "—"}</td>
                <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(e.amount)}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => remove(e.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
