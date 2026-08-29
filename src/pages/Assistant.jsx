import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, Bot, User, ShieldCheck } from "lucide-react";

const SUGGESTIONS = {
  student: [
    "Find jobs related to my major",
    "What jobs match my skills?",
    "How do I improve my profile?",
    "Help me prepare for an interview",
    "What should I include in my CV?",
  ],
  company: [
    "Help me create a job posting",
    "What skills should I require for this position?",
    "Help me write interview questions",
    "How can I improve my job description?",
  ],
};

export default function Assistant() {
  const { role, user } = useProfile();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conv, setConv] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) return;
      try {
        const list = await base44.entities.AIConversation.filter({ user_id: user.id });
        if (active && list && list[0]) {
          setConv(list[0]);
          setMessages(list[0].messages || []);
        }
      } catch {}
    }
    load();
    return () => { active = false; };
  }, [user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const persist = async (newMessages) => {
    try {
      if (conv) {
        await base44.entities.AIConversation.update(conv.id, { messages: newMessages });
      } else {
        const created = await base44.entities.AIConversation.create({ user_id: user.id, user_role: role, messages: newMessages });
        setConv(created);
      }
    } catch {}
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const userMsg = { role: "user", content, timestamp: new Date().toISOString() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("shiftBot", {
        message: content,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        userRole: role || "student",
      });
      const reply = res?.data?.reply || res?.reply || "Sorry, I couldn't generate a response.";
      const botMsg = { role: "assistant", content: reply, timestamp: new Date().toISOString() };
      const updated = [...next, botMsg];
      setMessages(updated);
      persist(updated);
    } catch (e) {
      const errMsg = { role: "assistant", content: "Shift Bot hit an error: " + (e.message || "try again"), timestamp: new Date().toISOString() };
      setMessages([...next, errMsg]);
    } finally {
      setBusy(false);
    }
  };

  const suggestions = SUGGESTIONS[role] || SUGGESTIONS.student;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <PageHeader title="Shift Bot" subtitle="Your AI assistant for jobs, profiles, and interviews." />
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">Shift Bot gives recommendations only. Verifications, job approvals, and hiring decisions are always made by people — admins and companies.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col h-[560px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white mb-3"><Sparkles className="w-7 h-7" /></span>
              <h3 className="font-semibold">Ask Shift Bot anything</h3>
              <p className="text-sm text-muted-foreground mt-1">Try one of these to get started:</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm border border-indigo-100 hover:bg-indigo-100">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => {
            const mine = m.role === "user";
            return (
              <div key={i} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${mine ? "bg-indigo-100 text-indigo-600" : "bg-gradient-to-br from-indigo-600 to-violet-600 text-white"}`}>
                  {mine ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </span>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${mine ? "bg-indigo-600 text-white" : "bg-slate-100 text-foreground"}`}>
                  {m.content}
                </div>
              </div>
            );
          })}
          {busy && (
            <div className="flex gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white"><Bot className="w-4 h-4" /></span>
              <div className="px-4 py-2.5 rounded-2xl bg-slate-100 text-sm inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t border-border flex gap-2">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder="Ask Shift Bot…" className="resize-none" />
          <Button onClick={() => send()} disabled={busy} size="icon" className="h-auto"><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}
