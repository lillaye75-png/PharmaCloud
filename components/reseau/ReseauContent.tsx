"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { MapPin, Phone, Send, AlertTriangle, Plus, X, Navigation, Trash2, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const userIcon = L.divIcon({
  className: "",
  html: `<div style="background:#4f46e5;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const missingIcon = L.divIcon({
  className: "",
  html: `<svg viewBox="0 0 24 24" width="25" height="41" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 7 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><circle cx="12" cy="8" r="3" fill="#fff"/></svg>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const SENEGAL_CENTER: [number, number] = [14.5, -14.5];

interface Pharmacy {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

interface Request {
  id: string;
  product_name: string;
  quantity_needed: number;
  status: string;
  urgency: string;
  message?: string;
  created_at: string;
}

function LocationUpdater({ onLocated }: { onLocated: (pos: [number, number]) => void }) {
  const map = useMap();
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          onLocated(coords);
          map.flyTo(coords, 12);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [map, onLocated]);
  return null;
}

export default function ReseauContent() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [tab, setTab] = useState<"pharmacies" | "requests">("pharmacies");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [form, setForm] = useState({ supplying_tenant_id: "", product_name: "", quantity_needed: 1, urgency: "normal", message: "" });

  const handleLocated = useCallback((pos: [number, number]) => {
    setUserPosition(pos);
  }, []);

  const loadPharmacies = useCallback(async () => {
    try {
      const path = search ? `/network/pharmacies?search=${encodeURIComponent(search)}` : "/network/pharmacies";
      const data = await api.get<Pharmacy[]>(path);
      setPharmacies(data);
    } catch { setPharmacies([]); }
  }, [search]);

  const loadRequests = useCallback(async () => {
    try {
      const data = await api.get<Request[]>("/network/requests");
      setRequests(data);
    } catch { setRequests([]); }
  }, []);

  useEffect(() => { if (tab === "pharmacies") loadPharmacies(); else loadRequests(); }, [tab, loadPharmacies, loadRequests]);

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplying_tenant_id || !form.product_name) return;
    try {
      const params = new URLSearchParams({
        supplying_tenant_id: form.supplying_tenant_id,
        product_name: form.product_name,
        quantity_needed: String(form.quantity_needed),
        urgency: form.urgency,
      });
      if (form.message) params.append("message", form.message);
      await api.post(`/network/requests?${params}`);
      setShowForm(false);
      setForm({ supplying_tenant_id: "", product_name: "", quantity_needed: 1, urgency: "normal", message: "" });
      loadRequests();
      setTab("requests");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      await api.delete(`/network/requests/${id}`);
      loadRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réseau Inter-Pharmacies</h1>
          <p className="mt-1 text-sm text-gray-500">Trouvez des médicaments chez d&apos;autres pharmacies</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2 border-b border-gray-200">
        {(["pharmacies", "requests"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] ${
              tab === t ? "border-pharma-600 text-pharma-600" : "border-transparent text-gray-500"
            }`}
          >
            {t === "pharmacies" ? "Pharmacies" : "Mes demandes"}
          </button>
        ))}
      </div>

      {tab === "pharmacies" && (
        <div>
          <div className="relative mb-4 max-w-md">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une pharmacie..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-pharma-500 focus:outline-none"
            />
          </div>
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <Navigation size={14} className="text-pharma-600" />
            {userPosition ? "Position détectée" : "Activez votre position pour vous localiser sur la carte"}
          </div>
          <div className="mb-6 rounded-xl overflow-hidden border border-gray-200" style={{ height: 350 }}>
            <MapContainer center={userPosition || SENEGAL_CENTER} zoom={userPosition ? 12 : 7} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationUpdater onLocated={handleLocated} />
              {userPosition && (
                <Marker position={userPosition} icon={userIcon}>
                  <Popup><div className="text-sm font-medium">Vous êtes ici</div></Popup>
                </Marker>
              )}
              {pharmacies.map((p) => {
                const hasCoords = p.latitude != null && p.longitude != null;
                const pos: [number, number] = hasCoords ? [p.latitude!, p.longitude!] : SENEGAL_CENTER;
                return (
                  <Marker key={p.id} position={pos} icon={hasCoords ? defaultIcon : missingIcon}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{p.name}</p>
                        {p.address && <p className="text-gray-500">{p.address}</p>}
                        {p.phone && <p className="text-pharma-600">{p.phone}</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pharmacies.map((p) => (
              <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-full bg-pharma-100 flex items-center justify-center mb-3">
                  <span className="text-sm font-bold text-pharma-600">{p.name.charAt(0)}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{p.name}</h3>
                {p.address && <p className="mt-1 flex items-center gap-1 text-sm text-gray-500"><MapPin size={14} />{p.address}</p>}
                {p.phone && <a href={`tel:${p.phone}`} className="mt-1 flex items-center gap-1 text-sm text-pharma-600 hover:underline"><Phone size={14} />{p.phone}</a>}
                {p.latitude && p.longitude && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`} target="_blank" rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Navigation size={12} /> Itinéraire
                  </a>
                )}
                <button onClick={() => { setForm(f => ({ ...f, supplying_tenant_id: p.id })); setShowForm(true); }}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-pharma-600 hover:text-pharma-700">
                  <Send size={12} /> Faire une demande
                </button>
              </div>
            ))}
            {pharmacies.length === 0 && <p className="col-span-full text-center text-gray-400 py-8">Aucune pharmacie trouvée</p>}
          </div>
        </div>
      )}

      {tab === "requests" && (
        <div>
          <div className="mb-4">
            <button onClick={() => { setShowForm(true); setSelectedRequest(null); }}
              className="flex items-center gap-2 rounded-lg bg-pharma-600 px-4 py-2 text-sm font-medium text-white hover:bg-pharma-700">
              <Plus size={16} /> Nouvelle demande
            </button>
          </div>
          {requests.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <AlertTriangle size={40} className="mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">Aucune demande inter-pharmacie</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{r.product_name}</p>
                      <p className="text-sm text-gray-500">Quantité: {r.quantity_needed} | {formatDate(r.created_at)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.urgency === "critical" ? "bg-red-100 text-red-700" :
                          r.urgency === "urgent" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"
                        }`}>{r.urgency}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.status === "pending" ? "bg-amber-100 text-amber-700" :
                          r.status === "accepted" ? "bg-green-100 text-green-700" :
                          r.status === "rejected" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        }`}>{r.status === "pending" ? "En attente" : r.status === "accepted" ? "Acceptée" : r.status === "rejected" ? "Refusée" : r.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.message && (
                        <button onClick={() => setSelectedRequest(r)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-pharma-600" title="Voir le message">
                          <Eye size={15} />
                        </button>
                      )}
                      {r.status === "pending" && (
                        <button onClick={() => deleteRequest(r.id)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedRequest(null)}>
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Détail de la demande</h2>
                  <button onClick={() => setSelectedRequest(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="space-y-3 text-sm">
                  <div><span className="text-gray-500">Produit :</span> <span className="font-medium">{selectedRequest.product_name}</span></div>
                  <div><span className="text-gray-500">Quantité :</span> <span className="font-medium">{selectedRequest.quantity_needed}</span></div>
                  <div><span className="text-gray-500">Urgence :</span> <span className="font-medium">{selectedRequest.urgency}</span></div>
                  <div><span className="text-gray-500">Statut :</span> <span className="font-medium">{selectedRequest.status}</span></div>
                  <div><span className="text-gray-500">Date :</span> <span className="font-medium">{formatDate(selectedRequest.created_at)}</span></div>
                  {selectedRequest.message && (
                    <div>
                      <span className="text-gray-500">Message :</span>
                      <p className="mt-1 rounded-lg bg-gray-50 p-3 text-gray-700">{selectedRequest.message}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && !selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nouvelle demande</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={createRequest} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pharmacie</label>
                <select value={form.supplying_tenant_id} onChange={(e) => setForm(f => ({ ...f, supplying_tenant_id: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" required>
                  <option value="">Sélectionner...</option>
                  {pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Produit</label>
                <input value={form.product_name} onChange={(e) => setForm(f => ({ ...f, product_name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" required />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Quantité</label>
                  <input type="number" min={1} value={form.quantity_needed} onChange={(e) => setForm(f => ({ ...f, quantity_needed: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Urgence</label>
                  <select value={form.urgency} onChange={(e) => setForm(f => ({ ...f, urgency: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critique</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none" />
              </div>
              <button type="submit"
                className="w-full rounded-lg bg-pharma-600 py-2 text-sm font-medium text-white hover:bg-pharma-700">
                Envoyer la demande
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
