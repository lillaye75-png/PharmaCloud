"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Building2, MapPin, Phone, ShoppingCart, X, Loader2, CheckCircle } from "lucide-react";

interface Wholesaler {
  id: string;
  name: string;
  city: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
}

interface OrderProduct {
  product_id: string;
  quantity: number;
}

export default function GrossistesPage() {
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedW, setSelectedW] = useState<Wholesaler | null>(null);
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [wData, pData] = await Promise.all([
        api.get<{ wholesalers: Wholesaler[] }>("/wholesalers/wholesalers"),
        api.get<Product[]>("/products/"),
      ]);
      setWholesalers(wData.wholesalers);
      setProducts(pData);
    } catch {
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openOrder = (w: Wholesaler) => {
    setSelectedW(w);
    setOrderProducts([{ product_id: "", quantity: 1 }]);
    setNotes("");
    setSuccess("");
  };

  const addProductLine = () => {
    setOrderProducts([...orderProducts, { product_id: "", quantity: 1 }]);
  };

  const updateLine = (idx: number, field: keyof OrderProduct, value: string | number) => {
    setOrderProducts((prev) => prev.map((line, i) => i === idx ? { ...line, [field]: value } : line));
  };

  const removeLine = (idx: number) => {
    setOrderProducts((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedW) return;
    const validLines = orderProducts.filter((l) => l.product_id && l.quantity > 0);
    if (validLines.length === 0) { alert("Ajoutez au moins un produit."); return; }
    setSubmitting(true);
    try {
      await api.post("/wholesalers/orders", {
        wholesaler_id: selectedW.id,
        products: validLines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
        notes: notes || undefined,
      });
      setSuccess("Commande envoyée avec succès !");
      setTimeout(() => { setSelectedW(null); setSuccess(""); }, 2000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la commande");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-pharma-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-red-500">{error}</p>
        <button onClick={load} className="mt-4 text-sm text-pharma-600 hover:underline">Réessayer</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grossistes</h1>
          <p className="mt-1 text-sm text-gray-500">Gestion des commandes fournisseurs</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {wholesalers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <Building2 size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">Aucun grossiste trouvé</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wholesalers.map((w) => (
            <div key={w.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-pharma-50 text-pharma-600">
                <Building2 size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{w.name}</h3>
              <div className="mt-3 space-y-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-2"><MapPin size={14} /> {w.city}</div>
                <div className="flex items-center gap-2"><Phone size={14} /> {w.phone}</div>
              </div>
              <button onClick={() => openOrder(w)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700">
                <ShoppingCart size={16} /> Commander
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedW && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitOrder} className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Commande — {selectedW.name}</h3>
              <button type="button" onClick={() => setSelectedW(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {orderProducts.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select value={line.product_id} onChange={(e) => updateLine(idx, "product_id", e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none">
                    <option value="">Sélectionner un produit</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" min={1} value={line.quantity || ""}
                    onChange={(e) => updateLine(idx, "quantity", Number(e.target.value))}
                    className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-pharma-500 focus:outline-none"
                    placeholder="Qté" />
                  {orderProducts.length > 1 && (
                    <button type="button" onClick={() => removeLine(idx)} className="p-1 text-gray-400 hover:text-red-500"><X size={16} /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addProductLine}
                className="text-sm text-pharma-600 hover:underline">+ Ajouter un produit</button>
            </div>

            <div className="mt-4">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optionnel)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" rows={2} />
            </div>

            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm text-white hover:bg-pharma-700 disabled:opacity-50">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? "Envoi..." : "Confirmer la commande"}
              </button>
              <button type="button" onClick={() => setSelectedW(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Annuler</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
