"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Store, Clock, Truck, CreditCard, ToggleLeft, Save, ExternalLink, Upload } from "lucide-react";

export default function BoutiquePage() {
  const [tenant, setTenant] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    description: "",
    opening_hours: "",
    delivery_fee: 0,
    min_order: 0,
    is_open: false,
  });

  useEffect(() => {
    api.get<any>("/tenant/me").then((t) => {
      setTenant(t);
      const parsed = t.settings ? JSON.parse(t.settings) : {};
      setForm({
        description: parsed.description || "",
        opening_hours: parsed.opening_hours || "",
        delivery_fee: parsed.delivery_fee || 0,
        min_order: parsed.min_order || 0,
        is_open: parsed.is_open ?? false,
      });
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.put<any>("/tenant/me", {
        settings: JSON.stringify({
          description: form.description,
          opening_hours: form.opening_hours,
          delivery_fee: form.delivery_fee,
          min_order: form.min_order,
          is_open: form.is_open,
        }),
      });
      setTenant(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = api.getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1"}/tenant/logo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setTenant({ ...tenant, logo_url: data.logo_url });
    } catch {
      alert("Erreur lors de l'upload du logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Configuration boutique</h1>
      <p className="text-sm text-gray-500 mb-6">Paramètres de votre boutique en ligne</p>

      {tenant && (
        <div className="space-y-6 max-w-2xl">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Store size={20} className="text-pharma-600" /> Informations boutique
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">URL de la boutique</label>
                <a
                  href={`/shop/${tenant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-pharma-600 hover:underline text-sm"
                >
                  pharmacloud.app/shop/{tenant.slug} <ExternalLink size={14} />
                </a>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Présentez votre pharmacie..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-pharma-600" /> Horaires d'ouverture
            </h2>
            <div>
              <textarea
                value={form.opening_hours}
                onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
                rows={4}
                placeholder="Lun-Ven: 8h-19h&#10;Sam: 9h-17h&#10;Dim: Fermé"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck size={20} className="text-pharma-600" /> Livraison & tarifs
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Truck size={14} /> Frais de livraison (FCFA)
                </label>
                <input
                  type="number"
                  value={form.delivery_fee}
                  onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value) })}
                  min={0}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <CreditCard size={14} /> Commande minimum (FCFA)
                </label>
                <input
                  type="number"
                  value={form.min_order}
                  onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })}
                  min={0}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ToggleLeft size={20} className="text-pharma-600" /> Statut boutique
            </h2>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Boutique ouverte</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {form.is_open ? "Les clients peuvent passer commande" : "La boutique est fermée aux commandes"}
                </p>
              </div>
              <button
                onClick={() => setForm({ ...form, is_open: !form.is_open })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.is_open ? "bg-pharma-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.is_open ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload size={20} className="text-pharma-600" /> Logo
            </h2>
            <div className="space-y-4">
              {tenant.logo_url && (
                <img src={tenant.logo_url} alt="Logo" className="h-20 w-20 rounded-xl object-cover border" />
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 w-fit">
                <Upload size={16} />
                {uploading ? "Upload en cours..." : "Choisir un fichier"}
                <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pb-8">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-pharma-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50"
            >
              <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
