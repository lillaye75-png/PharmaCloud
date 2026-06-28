"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { UserPlus, Mail, Shield, Trash2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: string;
  is_active: boolean;
}

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email: "", password: "changeme123", first_name: "", last_name: "", role: "cashier" });

  const load = useCallback(async () => {
    try { const data = await api.get<User[]>("/users/"); setUsers(data); }
    catch { setUsers([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/users/invite", form);
      setShowInvite(false);
      setForm({ email: "", password: "changeme123", first_name: "", last_name: "", role: "cashier" });
      load();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Erreur"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    try { await api.delete(`/users/${id}`); load(); }
    catch { alert("Erreur"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="mt-1 text-sm text-gray-500">Gestion du personnel de la pharmacie</p>
        </div>
        <button onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700">
          <UserPlus size={18} /> Inviter
        </button>
      </div>

      {showInvite && (
        <form onSubmit={invite} className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Inviter un membre</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Prénom" value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            <input placeholder="Nom" value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            <input required placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
              className="sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none">
              <option value="cashier">Caissier</option>
              <option value="pharmacist">Pharmacien</option>
              <option value="owner">Propriétaire</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-pharma-600 px-4 py-2 text-sm text-white hover:bg-pharma-700">Inviter</button>
            <button type="button" onClick={() => setShowInvite(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Annuler</button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.first_name || ""} {u.last_name || ""}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.role === "owner" ? "bg-violet-100 text-violet-700" :
                    u.role === "pharmacist" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                  }`}><Shield size={12} /> {u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`${u.is_active ? "text-green-600" : "text-red-500"} text-xs font-medium`}>{u.is_active ? "Actif" : "Inactif"}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(u.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
