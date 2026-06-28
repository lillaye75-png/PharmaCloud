"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react";

interface StockMovement {
  id: string;
  product_name: string;
  movement_type: "entry" | "exit";
  quantity: number;
  reason?: string;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  entry: "Entrée",
  exit: "Sortie",
};

const TYPE_STYLES: Record<string, string> = {
  entry: "bg-green-100 text-green-700",
  exit: "bg-red-100 text-red-700",
};

const FILTER_TYPES = [
  { value: "", label: "Tous" },
  { value: "entry", label: "Entrées" },
  { value: "exit", label: "Sorties" },
];

export default function MouvementsStockPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [apiError, setApiError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    try {
      const params = typeFilter ? `?movement_type=${typeFilter}` : "";
      const data = await api.get<StockMovement[]>(`/inventories/stock-movements${params}`);
      setMovements(data);
    } catch {
      setMovements([]);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mouvements de stock</h1>
          <p className="mt-1 text-sm text-gray-500">Historique des entrées et sorties</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <RefreshCw size={18} /> Actualiser
        </button>
      </div>

      {!apiError && (
        <div className="mb-4 flex items-center gap-2">
          {FILTER_TYPES.map((f) => (
            <button key={f.value} onClick={() => setTypeFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === f.value
                  ? "bg-pharma-600 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500">Chargement...</p>
        </div>
      ) : apiError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500">Module mouvements - API en cours de développement</p>
        </div>
      ) : movements.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <ArrowDownRight size={40} className="mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">Aucun mouvement trouvé</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Quantité</th>
                <th className="px-4 py-3">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(m.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{m.product_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[m.movement_type] || "bg-gray-100 text-gray-700"}`}>
                      {m.movement_type === "entry" ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                      {TYPE_LABELS[m.movement_type] || m.movement_type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    m.movement_type === "entry" ? "text-green-600" : "text-red-600"
                  }`}>
                    {m.movement_type === "entry" ? "+" : "-"}{m.quantity}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
