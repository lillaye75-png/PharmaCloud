"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";

export default function InventaireDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>("/inventories/").then((d) => d.find((i: any) => i.id === id)),
      api.get<any[]>(`/inventories/${id}/items`).catch(() => []),
    ])
      .then(([invData, itemsData]) => {
        setInv(invData);
        setItems(itemsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;
  if (!inv) return <div className="p-8 text-center text-gray-500">Inventaire non trouvé</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventaire {inv.type}</h1>
          <p className="text-sm text-gray-500">
            {inv.status === "completed" ? "Terminé" : "En cours"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Stock théorique</th>
              <th className="px-4 py-3">Stock compté</th>
              <th className="px-4 py-3">Écart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{item.product_id}</td>
                <td className="px-4 py-3 text-gray-600">{item.theoretical_stock}</td>
                <td className="px-4 py-3">{item.counted_stock ?? "—"}</td>
                <td className="px-4 py-3">
                  {item.variance != null ? (
                    <span className={`font-medium ${item.variance === 0 ? "text-green-600" : item.variance > 0 ? "text-blue-600" : "text-red-600"}`}>
                      {item.variance > 0 ? "+" : ""}{item.variance}
                    </span>
                  ) : "—"}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Aucun article dans cet inventaire</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
