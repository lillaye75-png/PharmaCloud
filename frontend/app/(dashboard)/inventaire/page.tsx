"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ClipboardList, CheckCircle, Clock, Plus } from "lucide-react";

interface Inventory {
  id: string;
  type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  notes?: string;
}

export default function InventairePage() {
  const router = useRouter();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Inventory[]>("/inventories/");
      setInventories(data);
    } catch {
      setInventories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventaire</h1>
          <p className="mt-1 text-sm text-gray-500">Gestion des inventaires et écarts de stock</p>
        </div>
        <button onClick={() => router.push("/inventaire/nouveau")} className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700">
          <Plus size={18} /> Nouvel inventaire
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500">Chargement...</p>
        </div>
      ) : inventories.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <ClipboardList size={40} className="mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">Aucun inventaire pour le moment</p>
          <p className="text-sm text-gray-400">Lancez votre premier inventaire pour suivre vos stocks</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inventories.map((inv) => (
            <div key={inv.id} onClick={() => router.push(`/inventaire/${inv.id}`)} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm cursor-pointer hover:border-pharma-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  inv.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {inv.status === "completed" ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {inv.status === "completed" ? "Terminé" : "En cours"}
                </span>
                <span className="text-xs text-gray-400">{inv.type}</span>
              </div>
              <p className="text-sm text-gray-500">Début: {formatDate(inv.started_at)}</p>
              {inv.completed_at && <p className="text-sm text-gray-500">Fin: {formatDate(inv.completed_at)}</p>}
              {inv.notes && <p className="mt-2 text-sm text-gray-600 line-clamp-2">{inv.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
