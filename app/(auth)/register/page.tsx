"use client";

import { useState } from "react";
import Link from "next/link";
import { Pill } from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pharma-500 to-pharma-600 shadow-lg mb-4">
          <Pill size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Créer votre espace</h1>
        <p className="mt-1 text-sm text-gray-500">Étape {step} sur 2</p>
      </div>

      <div className="mb-6 flex gap-2">
        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-pharma-500" : "bg-gray-200"}`} />
        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-pharma-500" : "bg-gray-200"}`} />
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none" placeholder="Votre prénom" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none" placeholder="Votre nom" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none" placeholder="email@exemple.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none" placeholder="Minimum 8 caractères" />
          </div>
          <button onClick={() => setStep(2)} className="w-full rounded-xl bg-gradient-to-r from-pharma-500 to-pharma-600 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl">Suivant</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la pharmacie</label>
            <input className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none" placeholder="Pharmacie Centrale" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL personnalisée</label>
            <div className="flex items-center rounded-xl border border-gray-300 overflow-hidden focus-within:border-pharma-500 focus-within:ring-2 focus-within:ring-pharma-500/20">
              <span className="px-3 text-sm text-gray-500 bg-gray-50 py-2.5 border-r border-gray-300">pharmacloud.app/shop/</span>
              <input className="flex-1 px-3 py-2.5 text-sm outline-none" placeholder="votre-pharmacie" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pharma-500 focus:ring-2 focus:ring-pharma-500/20 outline-none" placeholder="+221 77 123 45 67" />
          </div>
          <button className="w-full rounded-xl bg-gradient-to-r from-pharma-500 to-pharma-600 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl">
            Créer mon espace
          </button>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-pharma-600 hover:text-pharma-700">
          Se connecter
        </Link>
      </div>
    </div>
  );
}
