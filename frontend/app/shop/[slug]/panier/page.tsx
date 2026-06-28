"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, ArrowLeft, ShoppingBag } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export default function PanierPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("pc_cart") || "[]"));
  }, []);

  const updateCart = (items: CartItem[]) => {
    setCart(items);
    localStorage.setItem("pc_cart", JSON.stringify(items));
  };

  const remove = (id: string) => updateCart(cart.filter((i) => i.id !== id));
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return remove(id);
    updateCart(cart.map((i) => (i.id === id ? { ...i, qty } : i)));
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  const handleCheckout = async () => {
    if (!form.name || !form.phone) { alert("Veuillez remplir vos coordonnées"); return; }
    try {
      const res = await fetch(`${API_URL}/shop/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: form.phone,
          delivery_type: form.address ? "delivery" : "pickup",
          delivery_address: form.address || undefined,
          items: cart.map((i) => ({ product_id: i.id, quantity: i.qty })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      localStorage.removeItem("pc_cart");
      router.push(`/shop/${slug}/commande/${data.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push(`/shop/${slug}`)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Votre panier</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {cart.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingBag size={48} className="mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">Votre panier est vide</p>
            <button onClick={() => router.push(`/shop/${slug}`)}
              className="mt-4 rounded-lg bg-pharma-600 px-6 py-2 text-white text-sm font-medium hover:bg-pharma-700">
              Continuer mes achats
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.price.toLocaleString()} FCFA</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, item.qty - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border text-gray-500 hover:bg-gray-50">−</button>
                      <span className="w-8 text-center font-medium">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border text-gray-500 hover:bg-gray-50">+</button>
                    </div>
                    <button onClick={() => remove(item.id)} className="p-2 text-gray-400 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border h-fit">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif</h2>
              <div className="space-y-2 text-sm">
                {cart.map((i) => (
                  <div key={i.id} className="flex justify-between">
                    <span className="text-gray-500">{i.name} x{i.qty}</span>
                    <span>{(i.price * i.qty).toLocaleString()} FCFA</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{total.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <input placeholder="Votre nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
                <input placeholder="Téléphone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
                <input placeholder="Adresse de livraison (optionnel)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
                <button onClick={handleCheckout}
                  className="w-full rounded-lg bg-pharma-600 py-3 text-sm font-medium text-white hover:bg-pharma-700">
                  Commander
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
