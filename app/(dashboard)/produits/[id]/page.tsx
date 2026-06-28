"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Edit, Package, AlertTriangle, Barcode, Pill, Building, ClipboardList } from "lucide-react";

interface Product {
  id: string;
  name: string;
  generic_name?: string;
  barcode?: string;
  description?: string;
  dosage_form?: string;
  dosage_strength?: string;
  selling_price: number;
  purchase_price: number;
  current_stock: number;
  min_stock_alert: number;
  manufacturer?: string;
  is_visible_in_shop: boolean;
  requires_prescription: boolean;
  expiry_date?: string;
}

interface HistoryEntry {
  id: string;
  type: string;
  quantity: number;
  reason?: string;
  date: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prod, hist] = await Promise.all([
        api.get<Product>(`/products/${id}`),
        api.get<HistoryEntry[]>(`/products/${id}/history`),
      ]);
      setProduct(prod);
      setHistory(hist);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      alert(msg);
      router.push("/produits");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  if (loading || !product) {
    return <div className="p-8 text-center text-gray-500">Chargement...</div>;
  }

  const isLowStock = product.current_stock <= product.min_stock_alert;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push("/produits")} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {product.generic_name && `${product.generic_name} — `}
            {product.dosage_strength && product.dosage_strength}
            {product.dosage_form && ` (${product.dosage_form})`}
          </p>
        </div>
        <button
          onClick={() => router.push(`/produits/${id}/edit`)}
          className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700"
        >
          <Edit size={18} /> Modifier
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Informations générales</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Barcode size={18} className="mt-0.5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Code-barres</p>
                  <p className="font-medium text-gray-900">{product.barcode || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Pill size={18} className="mt-0.5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Forme / Dosage</p>
                  <p className="font-medium text-gray-900">
                    {[product.dosage_form, product.dosage_strength].filter(Boolean).join(" — ") || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building size={18} className="mt-0.5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Fabricant</p>
                  <p className="font-medium text-gray-900">{product.manufacturer || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ClipboardList size={18} className="mt-0.5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Ordonnance requise</p>
                  <p className="font-medium text-gray-900">{product.requires_prescription ? "Oui" : "Non"}</p>
                </div>
              </div>
            </div>
            {product.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{product.description}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Historique des mouvements de stock</h2>
            </div>
            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Aucun mouvement enregistré</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Quantité</th>
                      <th className="px-6 py-3">Motif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-600">{formatDate(h.date)}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            h.type === "entrée" || h.type === "entry" || h.type === "in"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {h.type}
                          </span>
                        </td>
                        <td className={`px-6 py-3 font-medium ${
                          h.type === "entrée" || h.type === "entry" || h.type === "in"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}>
                          {h.type === "entrée" || h.type === "entry" || h.type === "in" ? "+" : "-"}{h.quantity}
                        </td>
                        <td className="px-6 py-3 text-gray-600">{h.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Stock</h2>
            <div className={`flex items-center gap-3 p-4 rounded-lg ${isLowStock ? "bg-red-50" : "bg-green-50"}`}>
              <div className={`rounded-lg p-3 ${isLowStock ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                <Package size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Stock actuel</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${isLowStock ? "text-red-700" : "text-green-700"}`}>
                    {product.current_stock}
                  </p>
                  {isLowStock && <AlertTriangle size={18} className="text-red-500" />}
                </div>
                <p className="text-xs text-gray-400 mt-1">Seuil d&apos;alerte : {product.min_stock_alert}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Prix</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Prix d&apos;achat</span>
                <span className="font-medium text-gray-900">{formatCurrency(product.purchase_price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Prix de vente</span>
                <span className="font-medium text-pharma-600">{formatCurrency(product.selling_price)}</span>
              </div>
            </div>
          </div>

          {product.expiry_date && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Date de péremption</h2>
              <p className="font-medium text-gray-900">{formatDate(product.expiry_date)}</p>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Boutique en ligne</h2>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              product.is_visible_in_shop ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {product.is_visible_in_shop ? "Visible" : "Masqué"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
