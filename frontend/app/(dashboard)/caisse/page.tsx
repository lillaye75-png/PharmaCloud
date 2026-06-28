"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Search, Plus, Minus, Trash2, Receipt, X, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface CartItem {
  product_id: string;
  name: string;
  generic_name?: string;
  unit_price: number;
  quantity: number;
  discount_percentage: number;
  total: number;
}

interface Product {
  id: string;
  name: string;
  generic_name?: string;
  barcode?: string;
  selling_price: number;
  current_stock: number;
  requires_prescription: boolean;
}

interface SaleResponse {
  id: string;
  sale_number: string;
  total_amount: number;
  created_at: string;
  payment_method: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

interface TenantInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export default function CaissePage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"cart" | "payment" | "done">("cart");
  const [lastSale, setLastSale] = useState<SaleResponse | null>(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [showCustomer, setShowCustomer] = useState(false);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<TenantInfo>("/tenant/me").then(setTenant).catch(() => {});
  }, []);

  const subtotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const total = cart.reduce((s, i) => s + i.total, 0);
  const change = paidAmount - total;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); setShowResults(false); return; }
    try {
      const data = await api.get<Product[]>(`/products/search?q=${encodeURIComponent(q)}`);
      setResults(data);
      setShowResults(true);
    } catch { setResults([]); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search, doSearch]);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === p.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === p.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price * (1 - i.discount_percentage / 100) }
            : i
        );
      }
      return [...prev, { product_id: p.id, name: p.name, generic_name: p.generic_name, unit_price: p.selling_price, quantity: 1, discount_percentage: 0, total: p.selling_price }];
    });
    setSearch("");
    setShowResults(false);
    searchRef.current?.focus();
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { setCart((prev) => prev.filter((i) => i.product_id !== id)); return; }
    setCart((prev) => prev.map((i) => i.product_id === id ? { ...i, quantity: qty, total: qty * i.unit_price * (1 - i.discount_percentage / 100) } : i));
  };

  const updateDiscount = (id: string, disc: number) => {
    setCart((prev) => prev.map((i) => i.product_id === id ? { ...i, discount_percentage: disc, total: i.quantity * i.unit_price * (1 - disc / 100) } : i));
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.product_id !== id));

  const handleSubmitSale = async () => {
    if (cart.length === 0) return;
    if (customer.name && !customer.name.trim()) {
      alert("Veuillez saisir le nom du client");
      return;
    }
    setIsProcessing(true);
    try {
      const sale = await api.post<SaleResponse>("/sales/", {
        payment_method: paymentMethod,
        customer_name: customer.name || undefined,
        customer_phone: customer.phone || undefined,
        customer_email: customer.email || undefined,
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_percentage: i.discount_percentage,
        })),
      });
      setLastSale(sale);
      setStep("done");
      setCart([]);
      setPaidAmount(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? String(err.message) : "Erreur lors de la vente";
      alert(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const newSale = () => {
    setStep("cart");
    setLastSale(null);
    setCustomer({ name: "", phone: "", email: "" });
    setShowCustomer(false);
    searchRef.current?.focus();
  };

  if (step === "done" && lastSale) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:bg-white">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl print:shadow-none print:border-0">
          <div className="p-6 print:p-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">{tenant?.name || "Pharmacie"}</h2>
              {tenant?.address && <p className="text-xs text-gray-500">{tenant.address}</p>}
              {tenant?.phone && <p className="text-xs text-gray-500">{tenant.phone}</p>}
              <p className="text-xs text-gray-500 mt-1">Facture</p>
            </div>

            <div className="border-t border-b border-gray-200 py-3 mb-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">N° ticket</span>
                <span className="font-medium text-gray-900">{lastSale.sale_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-900">{new Date(lastSale.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
              {lastSale.customer_name && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <span className="text-gray-900">{lastSale.customer_name}</span>
                  </div>
                  {lastSale.customer_phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tél</span>
                      <span className="text-gray-900">{lastSale.customer_phone}</span>
                    </div>
                  )}
                  {lastSale.customer_email && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email</span>
                      <span className="text-gray-900">{lastSale.customer_email}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Paiement</span>
                <span className="text-gray-900 capitalize">{lastSale.payment_method === "cash" ? "Espèces" : lastSale.payment_method === "card" ? "Carte" : lastSale.payment_method === "mobile_money" ? "Mobile Money" : "Virement"}</span>
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
                {cart.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 text-gray-900">{item.name}</td>
                    <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={3} className="pt-2 text-right text-sm text-gray-500">Sous-total</td>
                  <td className="pt-2 text-right text-sm">{formatCurrency(subtotal)}</td>
                </tr>
                {subtotal !== total && (
                  <tr>
                    <td colSpan={3} className="text-right text-sm text-green-600">Remise</td>
                    <td className="text-right text-sm text-green-600">-{formatCurrency(subtotal - total)}</td>
                  </tr>
                )}
                <tr className="border-t border-gray-200">
                  <td colSpan={3} className="pt-2 text-right font-bold text-gray-900">Total</td>
                  <td className="pt-2 text-right font-bold text-gray-900">{formatCurrency(lastSale.total_amount)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="flex flex-col gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="w-full rounded-lg bg-pharma-600 py-3 text-sm font-medium text-white hover:bg-pharma-700"
              >
                Imprimer
              </button>
              <button
                onClick={newSale}
                className="w-full rounded-lg border border-pharma-600 py-3 text-sm font-medium text-pharma-600 hover:bg-pharma-50"
              >
                Nouvelle vente
              </button>
              <button
                onClick={() => router.push("/caisse/historique")}
                className="w-full rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>

            <p className="hidden print:block text-center text-xs text-gray-400 mt-4">Merci de votre confiance !</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Caisse</h1>
          <p className="mt-1 text-sm text-gray-500">Point de vente — scannez ou recherchez des produits</p>
        </div>

        <div className="relative mb-4">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Scanner un code-barres ou rechercher un produit..."
            className="w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-4 text-lg focus:border-pharma-500 focus:outline-none"
            autoFocus
          />
          {showResults && results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-80 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.generic_name || p.barcode || ""}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-pharma-600">{formatCurrency(p.selling_price)}</span>
                    <span className={`text-xs ${p.current_stock <= 5 ? "text-red-500" : "text-gray-400"}`}>
                      Stock: {p.current_stock}
                    </span>
                    <Plus size={18} className="text-pharma-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-center">
              <ShoppingCart size={48} className="mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">Panier vide</p>
              <p className="text-sm text-gray-400">Recherchez un produit pour commencer</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">Produit</th>
                  <th className="px-4 py-3 text-center">Prix unitaire</th>
                  <th className="px-4 py-3 text-center">Qté</th>
                  <th className="px-4 py-3 text-center">Remise</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <tr key={item.product_id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.generic_name && <div className="text-xs text-gray-400">{item.generic_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><Minus size={14} /></button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><Plus size={14} /></button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.discount_percentage}
                        onChange={(e) => updateDiscount(item.product_id, Number(e.target.value))}
                        className="mx-auto block w-16 rounded border border-gray-300 px-2 py-1 text-center text-xs focus:border-pharma-500 focus:outline-none"
                        min={0} max={100}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeItem(item.product_id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="w-80 flex flex-col">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex-1 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif</h2>

          {step === "cart" && (
            <div className="mb-4">
              <button
                onClick={() => setShowCustomer(!showCustomer)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span>Ajouter client</span>
                {showCustomer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showCustomer && (
                <div className="mt-3 space-y-2">
                  <input
                    value={customer.name}
                    onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Nom du client *"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none"
                  />
                  <input
                    value={customer.phone}
                    onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="Téléphone"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none"
                  />
                  <input
                    value={customer.email}
                    onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                    placeholder="Email"
                    type="email"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 text-sm flex-1">
            <div className="flex justify-between text-gray-500">
              <span>Articles ({itemCount})</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {cart.some((i) => i.discount_percentage > 0) && (
              <div className="flex justify-between text-green-600">
                <span>Remises</span>
                <span>-{formatCurrency(subtotal - total)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {step === "cart" && (
            <button
              onClick={() => setStep("payment")}
              disabled={cart.length === 0}
              className="mt-4 w-full rounded-lg bg-pharma-600 py-3 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Passer au paiement
            </button>
          )}

          {step === "payment" && (
            <div className="space-y-4 mt-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "cash", label: "Espèces" },
                    { value: "card", label: "Carte" },
                    { value: "mobile_money", label: "Mobile Money" },
                    { value: "transfer", label: "Virement" },
                  ].map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                        paymentMethod === m.value ? "border-pharma-500 bg-pharma-50 text-pharma-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "cash" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant reçu (FCFA)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none"
                  />
                  {paidAmount >= total && (
                    <p className="mt-1 text-sm font-medium text-green-600">Monnaie: {formatCurrency(change)}</p>
                  )}
                  {paidAmount > 0 && paidAmount < total && (
                    <p className="mt-1 text-sm font-medium text-red-500">Montant insuffisant</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setStep("cart")} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Retour
                </button>
                <button
                  onClick={handleSubmitSale}
                  disabled={isProcessing || (paymentMethod === "cash" && paidAmount < total)}
                  className="flex-1 rounded-lg bg-pharma-600 py-2.5 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50"
                >
                  {isProcessing ? "..." : "Finaliser"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
