"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Pill, Phone, MapPin, ShoppingCart, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

interface ShopInfo {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface Product {
  id: string;
  name: string;
  generic_name?: string;
  dosage_form?: string;
  dosage_strength?: string;
  selling_price: number;
  requires_prescription: boolean;
  manufacturer?: string;
}

export default function ShopPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const [info, prods] = await Promise.all([
          fetch(`${API_URL}/shop/${slug}`).then((r) => r.json()),
          fetch(`${API_URL}/shop/${slug}/products`).then((r) => r.json()),
        ]);
        setShop(info);
        setProducts(prods);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [slug]);

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.generic_name && p.generic_name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Pill size={40} className="mx-auto animate-pulse text-pharma-600" />
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {shop?.logo_url && <img src={shop.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{shop?.name || "Pharmacie"}</h1>
              <p className="text-xs text-gray-400">Boutique en ligne</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {shop?.phone && (
              <a href={`tel:${shop.phone}`} className="flex items-center gap-1 hover:text-pharma-600">
                <Phone size={16} /> {shop.phone}
              </a>
            )}
            <button
              onClick={() => router.push(`/shop/${slug}/panier`)}
              className="relative rounded-lg p-2 hover:bg-gray-100"
            >
              <ShoppingCart size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="relative mb-8">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un médicament, un produit..."
            className="w-full rounded-xl border-2 border-gray-200 py-3 pl-12 pr-4 text-lg focus:border-pharma-500 focus:outline-none"
          />
        </div>

        {shop?.address && (
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={16} />
            {shop.address}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900">{p.name}</h3>
              {p.generic_name && <p className="mt-0.5 text-xs text-gray-400">{p.generic_name}</p>}
              {p.dosage_strength && <p className="mt-1 text-xs text-gray-500">{p.dosage_strength}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-pharma-600">{p.selling_price.toLocaleString()} FCFA</span>
                {p.requires_prescription && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Ordonnance</span>
                )}
              </div>
              <button
                onClick={() => {
                  const cart = JSON.parse(localStorage.getItem("pc_cart") || "[]");
                  const existing = cart.find((i: any) => i.id === p.id);
                  if (existing) existing.qty += 1;
                  else cart.push({ id: p.id, name: p.name, price: p.selling_price, qty: 1 });
                  localStorage.setItem("pc_cart", JSON.stringify(cart));
                  alert("Ajouté au panier");
                }}
                className="mt-3 w-full rounded-lg bg-pharma-600 py-2 text-sm font-medium text-white hover:bg-pharma-700"
              >
                Ajouter au panier
              </button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-500">Aucun produit trouvé</p>
          </div>
        )}
      </main>

      <footer className="border-t bg-white py-6 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} PharmaCloud — Tous droits réservés
      </footer>
    </div>
  );
}
