"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { MessageCircle, Send, Loader2, ChevronDown, ChevronRight, Mail, Phone, HelpCircle } from "lucide-react";

const faqs = [
  { q: "Comment ajouter un produit ?", a: "Allez dans Stock > Produits, puis cliquez sur 'Nouveau produit'. Remplissez les informations requises et enregistrez." },
  { q: "Comment gérer les stocks ?", a: "Utilisez la section Inventaire pour effectuer des comptages et ajuster les niveaux de stock." },
  { q: "Comment créer une vente ?", a: "Rendez-vous dans la section Caisse, sélectionnez les produits et finalisez la vente." },
  { q: "Comment suivre les commandes en ligne ?", a: "Les commandes en ligne sont accessibles depuis la section Boutique > Commandes." },
  { q: "Comment contacter le support ?", a: "Utilisez le chatbot ci-dessous ou contactez-nous par email à layedevops@gmail.com." },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AssistancePage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Bonjour ! Je suis PharmIA. Comment puis-je vous aider ?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await api.post<{ response: string }>("/ai/chat", { message: userMsg });
      setMessages((prev) => [...prev, { role: "assistant", content: res.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Assistance & Support</h1>
      <p className="text-sm text-gray-500 mb-6">Obtenez de l'aide pour utiliser PharmaCloud</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={20} className="text-pharma-600" />
            <h2 className="text-lg font-semibold text-gray-900">Chatbot PharmIA</h2>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                  msg.role === "user" ? "bg-pharma-600 text-white" : "bg-white text-gray-800 border border-gray-200"
                }`}>
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm text-gray-500 border border-gray-200">
                  <Loader2 size={14} className="animate-spin" /> Réflexion...
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Posez votre question..."
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-pharma-500 focus:outline-none"
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-pharma-600 text-white hover:bg-pharma-700 disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={20} className="text-pharma-600" />
            <h2 className="text-lg font-semibold text-gray-900">FAQ</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 text-left"
                >
                  {faq.q}
                  {expanded === i ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </button>
                {expanded === i && (
                  <div className="px-4 pb-3 text-sm text-gray-600 border-t border-gray-100 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nous contacter</h2>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-pharma-100 p-2.5">
              <Mail size={18} className="text-pharma-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <a href="mailto:layedevops@gmail.com" className="text-sm text-pharma-600 hover:underline">layedevops@gmail.com</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-pharma-100 p-2.5">
              <Phone size={18} className="text-pharma-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Téléphone</p>
              <p className="text-sm text-gray-600">+213 XX XX XX XX</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
