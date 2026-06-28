"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Store, CreditCard, Bell, Shield, Globe, Save, ExternalLink, Key, Smartphone } from "lucide-react";

export default function ParametresPage() {
  const [tab, setTab] = useState("pharmacy");
  const [tenant, setTenant] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pharmacyForm, setPharmacyForm] = useState({ name: "", address: "", phone: "", wilaya: "" });
  const [shopForm, setShopForm] = useState({ logo_url: "" });
  const [notifPrefs, setNotifPrefs] = useState({ stock_faible: false, peremption: false, nouvelle_commande: false, rapport_hebdo: false });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("pc_notif_prefs");
    if (saved) {
      try { setNotifPrefs(JSON.parse(saved)); } catch { /* ignore */ }
    }
    api.get<any>("/tenant/me").then((t) => {
      setTenant(t);
      setPharmacyForm({ name: t.name || "", address: t.address || "", phone: t.phone || "", wilaya: t.wilaya || "" });
      setShopForm({ logo_url: t.logo_url || "" });
      if (t.notification_preferences) {
        try {
          const prefs = JSON.parse(t.notification_preferences);
          setNotifPrefs((prev) => ({ ...prev, ...prefs }));
        } catch { /* ignore */ }
      }
    }).catch(() => {});
    api.get<any>("/billing/subscription").then(setBilling).catch(() => {});
  }, []);

  const savePharmacy = async () => {
    setSaving(true);
    try {
      const updated = await api.put<any>("/tenant/me", pharmacyForm);
      setTenant(updated);
      setEditing(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const saveShop = async () => {
    setSaving(true);
    try {
      const updated = await api.put<any>("/tenant/me", shopForm);
      setTenant(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setPasswordError("");
    setSaving(true);
    try {
      await api.put("/auth/change-password", { current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      alert("Mot de passe modifié avec succès");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch {
      alert("Fonctionnalité disponible prochainement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Paramètres</h1>
      <p className="text-sm text-gray-500 mb-6">Configuration de votre pharmacie</p>

      <div className="mb-6 flex gap-2 border-b border-gray-200 overflow-x-auto">
        {[
          { id: "pharmacy", label: "Pharmacie", icon: Store },
          { id: "shop", label: "Boutique en ligne", icon: Globe },
          { id: "billing", label: "Abonnement", icon: CreditCard },
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "security", label: "Sécurité", icon: Shield },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] whitespace-nowrap ${
              tab === t.id ? "border-pharma-600 text-pharma-600" : "border-transparent text-gray-500"
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "pharmacy" && tenant && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom de la pharmacie</label>
              {editing ? (
                <input value={pharmacyForm.name} onChange={(e) => setPharmacyForm({ ...pharmacyForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
              ) : (
                <p className="mt-1 text-gray-900">{tenant.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Adresse</label>
              {editing ? (
                <input value={pharmacyForm.address} onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
              ) : (
                <p className="mt-1 text-gray-900">{tenant.address || "Non renseignée"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone</label>
              {editing ? (
                <input value={pharmacyForm.phone} onChange={(e) => setPharmacyForm({ ...pharmacyForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
              ) : (
                <p className="mt-1 text-gray-900">{tenant.phone || "Non renseigné"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Wilaya</label>
              {editing ? (
                <input value={pharmacyForm.wilaya} onChange={(e) => setPharmacyForm({ ...pharmacyForm, wilaya: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
              ) : (
                <p className="mt-1 text-gray-900">{tenant.wilaya || "Non renseignée"}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              {editing ? (
                <>
                  <button onClick={savePharmacy} disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50">
                    <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                  <button onClick={() => { setEditing(false); setPharmacyForm({ name: tenant.name, address: tenant.address || "", phone: tenant.phone || "", wilaya: tenant.wilaya || "" }); }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Annuler
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700">
                  Modifier
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "shop" && tenant && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Boutique en ligne</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">URL de la boutique</label>
              <a href={`/shop/${tenant.slug}`} target="_blank"
                className="mt-1 flex items-center gap-1 text-pharma-600 hover:underline">
                pharmacloud.app/shop/{tenant.slug} <ExternalLink size={14} />
              </a>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <p className="mt-1 text-gray-900">{tenant.slug}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo URL</label>
              <input value={shopForm.logo_url} onChange={(e) => setShopForm({ logo_url: e.target.value })}
                placeholder="https://exemple.com/logo.png"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
              {shopForm.logo_url && (
                <img src={shopForm.logo_url} alt="logo" className="mt-2 h-16 w-16 rounded-lg object-cover border" />
              )}
            </div>
            <button onClick={saveShop} disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50">
              <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      {tab === "billing" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan actuel</h2>
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
            <div>
              <p className="font-medium text-gray-900">{billing?.plan === "free" ? "Gratuit" : billing?.plan || "Gratuit"}</p>
              <p className="text-sm text-gray-500">0 FCFA/mois</p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Actif</span>
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Bell size={20} className="text-pharma-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: "stock_faible", label: "Alerte stock faible", desc: "Recevez une notification quand un produit atteint le seuil minimum" },
              { key: "peremption", label: "Rappel de péremption", desc: "Recevez un rappel avant la date d'expiration des produits" },
              { key: "nouvelle_commande", label: "Nouvelle commande", desc: "Soyez informé des nouvelles commandes en ligne" },
              { key: "rapport_hebdo", label: "Rapport hebdomadaire", desc: "Recevez un récapitulatif hebdomadaire par email" },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                </div>
                <button
                  onClick={() => {
                    const next = { ...notifPrefs, [n.key]: !notifPrefs[n.key as keyof typeof notifPrefs] };
                    setNotifPrefs(next);
                    localStorage.setItem("pc_notif_prefs", JSON.stringify(next));
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifPrefs[n.key as keyof typeof notifPrefs] ? "bg-pharma-600" : "bg-gray-300"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifPrefs[n.key as keyof typeof notifPrefs] ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={async () => {
              localStorage.setItem("pc_notif_prefs", JSON.stringify(notifPrefs));
              try {
                await api.put("/tenant/me", { notification_preferences: JSON.stringify(notifPrefs) });
                alert("Préférences enregistrées");
              } catch {
                alert("Sauvegardé localement (serveur indisponible)");
              }
            }}
            className="mt-6 flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700">
            <Save size={16} /> Sauvegarder
          </button>
        </div>
      )}

      {tab === "security" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={20} className="text-pharma-600" />
            <h2 className="text-lg font-semibold text-gray-900">Sécurité</h2>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Key size={16} className="text-pharma-600" /> Changer le mot de passe
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mot de passe actuel</label>
                <input type="password" value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                <input type="password" value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe</label>
                <input type="password" value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
              </div>
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              <button onClick={changePassword} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700 disabled:opacity-50">
                <Save size={16} /> {saving ? "Enregistrement..." : "Modifier le mot de passe"}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Smartphone size={16} className="text-pharma-600" /> Sessions actives
            </h3>
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <Smartphone size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Aucune session active</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
