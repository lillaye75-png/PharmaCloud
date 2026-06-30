"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";

interface Category { id: string; name: string; }
interface Department { id: string; name: string; }

export default function NouveauProduitPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    name: "",
    generic_name: "",
    barcode: "",
    category_id: "",
    department_id: "",
    description: "",
    dosage_form: "",
    dosage_strength: "",
    selling_price: 0,
    purchase_price: 0,
    current_stock: 0,
    min_stock_alert: 5,
    vat_rate: 0,
    requires_prescription: false,
    manufacturer: "",
    is_visible_in_shop: true,
  });

  useEffect(() => {
    api.get<Category[]>("/categories/").then(setCategories).catch(() => {});
    api.get<Department[]>("/categories/departments").then(setDepartments).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (!payload.category_id) delete payload.category_id;
      if (!payload.department_id) delete payload.department_id;
      await api.post("/products/", payload);
      router.push("/produits");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau produit</h1>
          <p className="mt-1 text-sm text-gray-500">Ajouter un médicament ou article à l&apos;inventaire</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Informations générales</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Nom du produit *</label>
              <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Catégorie</label>
              <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none">
                <option value="">Sélectionner une catégorie</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Département</label>
              <select value={form.department_id} onChange={(e) => set("department_id", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none">
                <option value="">Sélectionner un département</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom générique (DCI)</label>
              <input value={form.generic_name} onChange={(e) => set("generic_name", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Code-barres</label>
              <input value={form.barcode} onChange={(e) => set("barcode", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Forme galénique</label>
              <input value={form.dosage_form} onChange={(e) => set("dosage_form", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" placeholder="Comprimé, Sirop, Injectable..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dosage</label>
              <input value={form.dosage_strength} onChange={(e) => set("dosage_strength", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" placeholder="500 mg, 1 g..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fabricant</label>
              <input value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Prix et Stock</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prix d&apos;achat (FCFA)</label>
              <input type="number" value={form.purchase_price} onChange={(e) => set("purchase_price", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prix de vente * (FCFA)</label>
              <input type="number" required value={form.selling_price} onChange={(e) => set("selling_price", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">TVA (%)</label>
              <input type="number" value={form.vat_rate} onChange={(e) => set("vat_rate", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock initial</label>
              <input type="number" value={form.current_stock} onChange={(e) => set("current_stock", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Seuil d&apos;alerte</label>
              <input type="number" value={form.min_stock_alert} onChange={(e) => set("min_stock_alert", Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.requires_prescription} onChange={(e) => set("requires_prescription", e.target.checked)}
                className="rounded border-gray-300 text-pharma-600 focus:ring-pharma-500" />
              Nécessite une ordonnance
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.is_visible_in_shop} onChange={(e) => set("is_visible_in_shop", e.target.checked)}
                className="rounded border-gray-300 text-pharma-600 focus:ring-pharma-500" />
              Visible dans la boutique en ligne
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-pharma-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50">
            <Save size={18} /> {saving ? "Enregistrement..." : "Enregistrer"}
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
