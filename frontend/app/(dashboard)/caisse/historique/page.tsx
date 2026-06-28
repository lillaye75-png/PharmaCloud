"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Receipt, Eye, Printer, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Sale {
  id: string;
  sale_number: string;
  status: string;
  payment_method: string;
  subtotal: number;
  total_amount: number;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

interface SaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
}

interface SaleDetail extends Sale {
  items: SaleItem[];
}

export default function HistoriqueCaissePage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Sale[]>("/sales/");
      setSales(data);
    } catch { setSales([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (id: string) => {
    try {
      const data = await api.get<SaleDetail>(`/sales/${id}`);
      setSelectedSale(data);
      setSaleItems(data.items || []);
      setShowDetail(true);
    } catch {
      alert("Impossible de charger les détails de la vente");
    }
  };

  const handleReprint = async (id: string) => {
    try {
      const data = await api.get<SaleDetail>(`/sales/${id}`);
      setSelectedSale(data);
      setSaleItems(data.items || []);
      setShowDetail(true);
      setTimeout(() => window.print(), 300);
    } catch {
      alert("Impossible de charger la facture");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette vente ?")) return;
    try {
      await api.delete(`/sales/${id}`);
      load();
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historique des ventes</h1>
        <p className="mt-1 text-sm text-gray-500">Consultez toutes les ventes effectuées</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Chargement...</div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt size={40} className="mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">Aucune vente enregistrée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3">N° ticket</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Paiement</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.sale_number || s.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.status === "completed" ? "bg-green-100 text-green-700" :
                        s.status === "refunded" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.payment_method || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.total_amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => loadDetail(s.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-pharma-600"
                          title="Voir détails"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleReprint(s.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-pharma-600"
                          title="Réimprimer"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDetail && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:bg-white">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:border-0 print:max-h-none">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 print:hidden">
              <h3 className="text-lg font-semibold text-gray-900">Détails de la vente</h3>
              <button onClick={() => setShowDetail(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 print:p-4">
              <div className="text-center mb-6 print:mb-4">
                <h2 className="text-lg font-bold text-gray-900">Pharmacie</h2>
                <p className="text-xs text-gray-500">Facture</p>
              </div>

              <div className="border-t border-b border-gray-200 py-3 mb-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">N° ticket</span>
                  <span className="font-medium text-gray-900">{selectedSale.sale_number || selectedSale.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900">{formatDate(selectedSale.created_at)}</span>
                </div>
                {selectedSale.customer_name && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Client</span>
                      <span className="text-gray-900">{selectedSale.customer_name}</span>
                    </div>
                    {selectedSale.customer_phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tél</span>
                        <span className="text-gray-900">{selectedSale.customer_phone}</span>
                      </div>
                    )}
                    {selectedSale.customer_email && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email</span>
                        <span className="text-gray-900">{selectedSale.customer_email}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Paiement</span>
                  <span className="text-gray-900 capitalize">{selectedSale.payment_method === "cash" ? "Espèces" : selectedSale.payment_method === "card" ? "Carte" : selectedSale.payment_method === "mobile_money" ? "Mobile Money" : "Virement"}</span>
                </div>
              </div>

              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                    <th className="pb-2 text-left">Produit</th>
                    <th className="pb-2 text-center">Qté</th>
                    <th className="pb-2 text-right">Prix</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {saleItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-gray-900">{item.product_id.slice(0, 8)}</td>
                      <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-2 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                      <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="pt-2 text-right text-sm text-gray-500">Sous-total</td>
                    <td className="pt-2 text-right text-sm">{formatCurrency(selectedSale.subtotal)}</td>
                  </tr>
                  {selectedSale.subtotal !== selectedSale.total_amount && (
                    <tr>
                      <td colSpan={3} className="text-right text-sm text-green-600">Remise</td>
                      <td className="text-right text-sm text-green-600">-{formatCurrency(selectedSale.subtotal - selectedSale.total_amount)}</td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="pt-2 text-right font-bold text-gray-900">Total</td>
                    <td className="pt-2 text-right font-bold text-gray-900">{formatCurrency(selectedSale.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="flex justify-center print:hidden">
                <button
                  onClick={() => setShowDetail(false)}
                  className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>

              <p className="hidden print:block text-center text-xs text-gray-400 mt-4">Merci de votre confiance !</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
