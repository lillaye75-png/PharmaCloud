"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package, Clock, CheckCircle, XCircle, Printer, Trash2 } from "lucide-react";
import { usePolling } from "@/lib/usePolling";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Order {
  id: string;
  order_number: string;
  status: string;
  delivery_type: string;
  subtotal: number;
  total: number;
  payment_status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  preparing: { label: "En préparation", color: "bg-violet-100 text-violet-700", icon: Package },
  ready: { label: "Prête", color: "bg-green-100 text-green-700", icon: CheckCircle },
  delivered: { label: "Livrée", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function CommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");
  const [confirm, setConfirm] = useState<{ id: string; status: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const path = filter ? `/orders/?status=${filter}` : "/orders/";
      const data = await api.get<Order[]>(path);
      setOrders(data);
    } catch {
      setOrders([]);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  usePolling(load, 30000);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/orders/${id}/status?status=${status}`);
      setConfirm(null);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await api.delete(`/orders/${id}`);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const printOrder = (o: Order) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const sc = statusConfig[o.status] || { label: o.status };
    win.document.write(`
      <html><head><title>Bon de livraison - ${o.order_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
        h1 { color: #4f46e5; font-size: 18px; margin-bottom: 5px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
        .header h2 { margin: 0; font-size: 14px; color: #666; }
        .info { margin-bottom: 20px; }
        .info p { margin: 3px 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 13px; }
        th { background: #f3f4f6; }
        .total { text-align: right; font-weight: bold; margin-top: 15px; font-size: 16px; }
        .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <div class="header">
          <h1>PharmaCloud</h1>
          <h2>Bon de livraison</h2>
        </div>
        <div class="info">
          <p><strong>N° commande :</strong> ${o.order_number || o.id.slice(0, 8)}</p>
          <p><strong>Date :</strong> ${formatDate(o.created_at)}</p>
          <p><strong>Statut :</strong> ${sc.label}</p>
          <p><strong>Type :</strong> ${o.delivery_type === "delivery" ? "Livraison" : "Retrait"}</p>
          <p><strong>Paiement :</strong> ${o.payment_status === "paid" ? "Payé" : "Non payé"}</p>
        </div>
        <table>
          <tr><th>Description</th><th>Qté</th><th>Prix</th></tr>
          <tr><td>Commande ${o.order_number || o.id.slice(0, 8)}</td><td>1</td><td>${formatCurrency(o.total)}</td></tr>
        </table>
        <div class="total">Total : ${formatCurrency(o.total)}</div>
        <div class="footer">Généré par PharmaCloud - l'ERP intelligent pour les pharmacies africaines</div>
        <script>window.print();</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
          <p className="mt-1 text-sm text-gray-500">Gestion des commandes boutique en ligne</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {["", "pending", "confirmed", "preparing", "ready", "delivered", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${
              filter === s ? "bg-pharma-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s ? (statusConfig[s]?.label ?? s) : "Toutes"}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={40} className="mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">Aucune commande</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3">N° commande</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Livraison</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => {
                  const sc = statusConfig[o.status] || { label: o.status, color: "bg-gray-100 text-gray-700", icon: Clock };
                  const Icon = sc.icon;
                  return (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{o.order_number || o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.color}`}>
                          <Icon size={12} /> {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{o.delivery_type === "delivery" ? "Livraison" : "Retrait"}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.total)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => printOrder(o)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-pharma-600"
                            title="Imprimer bon de livraison">
                            <Printer size={15} />
                          </button>
                          {(o.status === "pending" || o.status === "confirmed") && (
                            <button onClick={() => setConfirm({ id: o.id, status: "cancelled" })}
                              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              title="Supprimer">
                              <Trash2 size={15} />
                            </button>
                          )}
                          {o.status === "pending" && (
                            <select
                              onChange={(e) => setConfirm({ id: o.id, status: e.target.value })}
                              className="rounded border border-gray-300 px-2 py-1 text-xs"
                              defaultValue=""
                            >
                              <option value="" disabled>Statut</option>
                              <option value="confirmed">Confirmer</option>
                              <option value="cancelled">Annuler</option>
                            </select>
                          )}
                          {o.status === "confirmed" && (
                            <button onClick={() => updateStatus(o.id, "preparing")}
                              className="rounded bg-pharma-600 px-3 py-1 text-xs text-white hover:bg-pharma-700">
                              Préparer
                            </button>
                          )}
                          {o.status === "preparing" && (
                            <button onClick={() => updateStatus(o.id, "ready")}
                              className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700">
                              Prête
                            </button>
                          )}
                          {o.status === "ready" && (
                            <button onClick={() => setConfirm({ id: o.id, status: "delivered" })}
                              className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700">
                              Livrer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          open={true}
          title={confirm.status === "delivered" ? "Confirmer la livraison" : confirm.status === "cancelled" ? "Annuler la commande" : "Changer le statut"}
          message={confirm.status === "delivered" ? "Le stock sera déduit et les frais de livraison seront comptabilisés." : confirm.status === "cancelled" ? "Cette action est irréversible." : "Confirmez-vous ce changement ?"}
          confirmLabel={confirm.status === "delivered" ? "Livrer" : confirm.status === "cancelled" ? "Annuler" : "Confirmer"}
          variant={confirm.status === "cancelled" ? "danger" : "info"}
          onConfirm={() => updateStatus(confirm.id, confirm.status)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
