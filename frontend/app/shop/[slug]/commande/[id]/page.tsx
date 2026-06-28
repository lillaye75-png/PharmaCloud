"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

export default function CommandeConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pc_orders") || "{}";
      const orders = JSON.parse(stored);
      const orderData = orders[id] || { id, order_number: `CMD-${id.slice(0, 8).toUpperCase()}`, total: 0 };
      setOrder(orderData);
    } catch {
      setOrder({ id, order_number: `CMD-${id.slice(0, 8).toUpperCase()}`, total: 0 });
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border text-center">
        <CheckCircle size={48} className="mx-auto text-green-500" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">Commande confirmée</h1>
        <p className="mt-2 text-gray-500">Votre commande a été envoyée à la pharmacie.</p>
        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">N° commande</span>
            <span className="font-medium">{order?.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-medium">{order?.total?.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Statut</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">En attente</span>
          </div>
        </div>
        <button onClick={() => router.push(`/shop/${slug}`)}
          className="mt-6 w-full rounded-lg bg-pharma-600 py-2 text-sm font-medium text-white hover:bg-pharma-700">
          Retour à la boutique
        </button>
      </div>
    </div>
  );
}
