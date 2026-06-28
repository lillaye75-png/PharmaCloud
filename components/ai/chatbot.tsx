"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { MessageCircle, Send, X, Pill, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Bonjour ! Je suis PharmIA, votre assistant pharmacie. Posez-moi vos questions sur les médicaments, symptômes, ou posologies." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-pharma-600 text-white shadow-lg hover:bg-pharma-700 transition-all"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex w-96 flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl max-h-[600px]">
          <div className="flex items-center justify-between rounded-t-2xl bg-pharma-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Pill size={18} />
              <span className="font-medium">PharmIA Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/20"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                  msg.role === "user" ? "bg-pharma-600 text-white" : "bg-gray-100 text-gray-800"
                }`}>
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-500">
                  <Loader2 size={14} className="animate-spin" /> Réflexion...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t p-3">
            <div className="flex gap-2">
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
        </div>
      )}
    </>
  );
}
