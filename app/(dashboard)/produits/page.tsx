"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Search, Plus, AlertTriangle, Package, Edit, Trash2 } from "lucide-react";
import { usePolling } from "@/lib/usePolling";

interface Product {
  id: string;
  name: string;
  generic_name?: string;
  barcode?: string;
  selling_price: number;
  current_stock: number;
  min_stock_alert: number;
  requires_prescription: boolean;
  expiry_date?: string;
  is_visible_in_shop: boolean;
}

export default function ProduitsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "low-stock" | "expiry">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let path = "/products/?size=200";
      if (tab === "low-stock") path = "/products/alerts/low-stock";
      else if (tab === "expiry") path = "/products/alerts/expiry?days=30";
      else if (search) path = `/products/search?q=${encodeURIComponent(search)}`;
      const data = await api.get<Product[]>(path);
      setProducts(data);
    } catch {
      if (tab === "all" && !search) setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => { load(); }, [load]);
  usePolling(load, 15000);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <p className="mt-1 text-sm text-gray-500">Gestion des médicaments et articles</p>
        </div>
        <button
          onClick={() => router.push("/produits/nouveau")}
          className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700"
        >
          <Plus size={18} /> Nouveau produit
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, code-barres..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-pharma-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-4 flex gap-2 border-b border-gray-200">
        {(["all", "low-stock", "expiry"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] ${
              tab === t ? "border-pharma-600 text-pharma-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "all" ? "Tous" : t === "low-stock" ? "Stock faible" : "Péremption"}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun produit trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Code-barres</th>
                  <th className="px-4 py-3">Prix</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Seuil</th>
                  <th className="px-4 py-3">Ordonnance</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div>{p.name}</div>
                      {p.generic_name && <div className="text-xs text-gray-400">{p.generic_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.barcode || "—"}</td>
                    <td className="px-4 py-3 text-gray-900">{p.selling_price.toLocaleString()} FCFA</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.current_stock <= p.min_stock_alert
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {p.current_stock <= p.min_stock_alert && <AlertTriangle size={12} />}
                        {p.current_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.min_stock_alert}</td>
                    <td className="px-4 py-3">
                      {p.requires_prescription ? (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Oui</span>
                      ) : (
                        <span className="text-gray-400">Non</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => router.push(`/produits/${p.id}/edit`)} className="rounded p-1 text-gray-400 hover:text-pharma-600" title="Modifier">
                          <Edit size={16} />
                        </button>
                        <button onClick={async () => { if (confirm("Supprimer ce produit ?")) try { await api.delete(`/products/${p.id}`); load(); } catch { alert("Erreur"); } }} className="rounded p-1 text-gray-400 hover:text-red-600" title="Supprimer">
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
    </div>
  );
}
