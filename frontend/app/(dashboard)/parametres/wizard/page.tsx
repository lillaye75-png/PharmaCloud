"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Globe,
  Network,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  X,
  Store,
} from "lucide-react";
import { api } from "@/lib/api";

const steps = [
  { id: 1, label: "Informations", icon: Building2 },
  { id: 2, label: "Boutique", icon: Globe },
  { id: 3, label: "Réseau", icon: Network },
  { id: 4, label: "Finalisation", icon: CheckCircle2 },
];

export default function WizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [wizardStatus, setWizardStatus] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [joinNetwork, setJoinNetwork] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<any>("/wizard/status").catch(() => null),
      api.get<any>("/tenant/me").catch(() => null),
    ]).then(([status, data]) => {
      setWizardStatus(status);
      if (data) {
        setTenant(data);
        setName(data.name || "");
        setAddress(data.address || "");
        setPhone(data.phone || "");
        setLicenseNumber(data.license_number || "");
        setSlug(data.slug || "");
      }
      if (status?.completed) {
        router.push("/parametres");
        return;
      }
      if (status?.current_step) {
        setCurrentStep(status.current_step);
      }
    }).finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    setSlugChecking(true);
    setSlugAvailable(null);
    const timer = setTimeout(() => {
      api.get<{ available: boolean }>(`/tenant/slug-check/${slug}`)
        .then((res) => setSlugAvailable(res.available))
        .catch(() => setSlugAvailable(false))
        .finally(() => setSlugChecking(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [slug]);

  const handleStep1 = async () => {
    setSubmitting(true);
    setError("");
    try {
      await api.put("/tenant/me", { name, address, phone, license_number: licenseNumber });
      setCurrentStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2 = async () => {
    if (!slugAvailable) return;
    setSubmitting(true);
    setError("");
    try {
      await api.put("/tenant/me", { slug });
      setCurrentStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep3 = async () => {
    setSubmitting(true);
    setError("");
    try {
      await api.put("/wizard/step/3", { join_network: joinNetwork });
      setCurrentStep(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/wizard/complete");
      router.push("/parametres");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la finalisation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-pharma-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pharma-500 to-pharma-600 shadow-lg mb-4">
          <Store size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Configuration de votre pharmacie</h1>
        <p className="mt-1 text-sm text-gray-500">Suivez les étapes pour paramétrer votre espace</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                    currentStep > step.id
                      ? "bg-green-500 text-white"
                      : currentStep === step.id
                        ? "bg-pharma-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {currentStep > step.id ? <Check size={18} /> : <step.icon size={18} />}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium ${
                    currentStep >= step.id ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-16 sm:w-24 h-0.5 mx-2 sm:mx-3 rounded ${
                    currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Informations de la pharmacie</h2>
              <p className="text-sm text-gray-500 mt-1">Renseignez les informations de votre officine</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la pharmacie *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none transition-all"
                placeholder="Pharmacie du Centre"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none transition-all"
                placeholder="123 Rue Principale, Dakar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none transition-all"
                placeholder="+221 77 123 45 67"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de licence</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none transition-all"
                placeholder="LIC-2024-001"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Configuration de la boutique</h2>
              <p className="text-sm text-gray-500 mt-1">Choisissez l&apos;adresse de votre boutique en ligne</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug URL *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  pharmacloud.app/shop/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                  className="w-full rounded-xl border border-gray-300 pl-[172px] pr-10 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none transition-all"
                  placeholder="ma-pharmacie"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {slugChecking ? (
                    <Loader2 size={18} className="animate-spin text-gray-400" />
                  ) : slugAvailable === true ? (
                    <Check size={18} className="text-green-500" />
                  ) : slugAvailable === false ? (
                    <X size={18} className="text-red-500" />
                  ) : null}
                </div>
              </div>
              {slugAvailable === true && (
                <p className="mt-1.5 text-xs text-green-600">Ce slug est disponible</p>
              )}
              {slugAvailable === false && (
                <p className="mt-1.5 text-xs text-red-600">Ce slug est déjà pris</p>
              )}
              <p className="mt-1.5 text-xs text-gray-400">Minimum 3 caractères, sans espaces</p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Réseau Inter-Pharmacies</h2>
              <p className="text-sm text-gray-500 mt-1">
                Rejoignez le réseau pour échanger des stocks et des informations avec d&apos;autres pharmacies
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <Network size={20} className="text-pharma-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Rejoindre le réseau</p>
                  <p className="text-xs text-gray-500">Visible par les autres pharmacies du réseau</p>
                </div>
              </div>
              <button
                onClick={() => setJoinNetwork(!joinNetwork)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  joinNetwork ? "bg-pharma-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    joinNetwork ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Finalisation</h2>
              <p className="text-sm text-gray-500 mt-1">Vérifiez vos informations avant de terminer</p>
            </div>
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500">Pharmacie</span>
                <span className="text-sm font-medium text-gray-900">{name || "Non renseigné"}</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500">Adresse</span>
                <span className="text-sm font-medium text-gray-900">{address || "Non renseignée"}</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500">Téléphone</span>
                <span className="text-sm font-medium text-gray-900">{phone || "Non renseigné"}</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500">Licence</span>
                <span className="text-sm font-medium text-gray-900">{licenseNumber || "Non renseigné"}</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500">Slug boutique</span>
                <span className="text-sm font-medium text-gray-900">{slug ? `/${slug}` : "Non renseigné"}</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500">Réseau inter-pharmacies</span>
                <span className="text-sm font-medium text-gray-900">
                  {joinNetwork ? "Inscrit" : "Non inscrit"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push("/parametres")}
            className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
            {currentStep === 1 ? "Annuler" : "Précédent"}
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => {
                if (currentStep === 1) handleStep1();
                else if (currentStep === 2) handleStep2();
                else if (currentStep === 3) handleStep3();
              }}
              disabled={
                submitting ||
                (currentStep === 1 && !name) ||
                (currentStep === 2 && (!slug || slug.length < 3 || slugAvailable !== true))
              }
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pharma-500 to-pharma-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-pharma-600 hover:to-pharma-700 disabled:opacity-50"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? "En cours..." : "Suivant"}
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? "Finalisation..." : "Terminer"}
              <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
