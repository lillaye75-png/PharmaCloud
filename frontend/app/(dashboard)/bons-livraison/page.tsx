"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Truck, Plus } from "lucide-react";

interface Slip {
  id: string;
  slip_number: string;
  supplier_name: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export default function BonsLivraisonPage() {
  const router = useRouter();
  const [slips, setSlips] = useState<Slip[]>([]);

  const load = useCallback(async () => {
    try { const data = await api.get<Slip[]>("/delivery-slips/"); setSlips(data); }
    catch { setSlips([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bons de livraison</h1>
          <p className="mt-1 text-sm text-gray-500">Réception des commandes fournisseurs</p>
        </div>
        <button onClick={() => router.push("/bons-livraison/nouveau")} className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700">
          <Plus size={18} /> Nouveau bon
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {slips.length === 0 ? (
          <div className="p-12 text-center">
            <Truck size={40} className="mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">Aucun bon de livraison</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">N° BL</th>
                <th className="px-4 py-3">Fournisseur</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slips.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.slip_number || s.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-gray-600">{s.supplier_name}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(s.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
