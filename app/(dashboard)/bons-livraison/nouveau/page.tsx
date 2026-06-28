"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Plus, Save, Trash2, Search } from "lucide-react";

interface Product {
  id: string;
  name: string;
  selling_price: number;
}

interface LineItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export default function NouveauBonLivraisonPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);

  const loadProducts = useCallback(async () => {
    try {
      const data = await api.get<Product[]>("/products/");
      setProducts(data);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = (product: Product) => {
    if (items.some((i) => i.product_id === product.id)) return;
    setItems([...items, { product_id: product.id, product_name: product.name, quantity: 1, unit_price: product.selling_price }]);
    setShowSearch(false);
    setSearch("");
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.product_id !== productId));
  };

  const updateItem = (productId: string, key: "quantity" | "unit_price", value: number) => {
    setItems(items.map((i) => (i.product_id === productId ? { ...i, [key]: value } : i)));
  };

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;
    if (items.length === 0) { alert("Ajoutez au moins un article"); return; }
    setSaving(true);
    try {
      await api.post("/delivery-slips/", {
        supplier_name: supplierName,
        notes: notes || undefined,
        items: items.map((i) => ({ product_id: i.product_id, quantity_ordered: i.quantity, quantity_received: i.quantity, unit_cost: i.unit_price })),
      });
      router.push("/bons-livraison");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau bon de livraison</h1>
          <p className="mt-1 text-sm text-gray-500">Réceptionner une commande fournisseur</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Informations fournisseur</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Nom du fournisseur *</label>
              <input required value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" placeholder="Nom du fournisseur" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" placeholder="Notes facultatives..." />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
            <button type="button" onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700">
              <Plus size={18} /> Ajouter un article
            </button>
          </div>

          {showSearch && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" placeholder="Rechercher un produit..." />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2 text-center">Aucun produit trouvé</p>
                ) : (
                  filteredProducts.map((p) => (
                    <button key={p.id} type="button" onClick={() => addItem(p)}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-white hover:shadow-sm transition-all">
                      <span className="font-medium text-gray-900">{p.name}</span>
                      <span className="text-gray-500">{formatCurrency(p.selling_price)}</span>
                    </button>
                  ))
                )}
              </div>
              <button type="button" onClick={() => { setShowSearch(false); setSearch(""); }}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700">Fermer</button>
            </div>
          )}

          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Aucun article ajouté. Cliquez sur &quot;Ajouter un article&quot; pour commencer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="px-4 py-3">Produit</th>
                    <th className="px-4 py-3 text-right">Quantité</th>
                    <th className="px-4 py-3 text-right">Prix unitaire</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.product_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.product_name}</td>
                      <td className="px-4 py-3">
                        <input type="number" min={1} value={item.quantity}
                          onChange={(e) => updateItem(item.product_id, "quantity", Number(e.target.value))}
                          className="ml-auto block w-20 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm focus:border-pharma-500 focus:outline-none" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min={0} step={1} value={item.unit_price}
                          onChange={(e) => updateItem(item.product_id, "unit_price", Number(e.target.value))}
                          className="ml-auto block w-28 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm focus:border-pharma-500 focus:outline-none" />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => removeItem(item.product_id)}
                          className="rounded-lg p-1 text-gray-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-gray-50 font-medium">
                    <td colSpan={3} className="px-4 py-3 text-right text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(totalAmount)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-pharma-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50">
            <Save size={18} /> {saving ? "Enregistrement..." : "Enregistrer le bon"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
