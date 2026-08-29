import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, ArrowLeft, Building2, GraduationCap, Flag } from "lucide-react";

export default function Messages() {
  const { role, studentProfile, companyProfile } = useProfile();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const endRef = useRef(null);

  const myProfileId = role === "student" ? studentProfile?.id : companyProfile?.id;

  const loadConversations = async () => {
    if (!myProfileId) return;
    try {
      const filter = role === "student"
        ? { student_id: myProfileId }
        : { company_id: myProfileId };
      const list = await base44.entities.Conversation.filter(filter, "-last_message_at", 100);
      setConversations(list || []);
      if (!activeId && list && list.length) setActiveId(list[0].id);
    } catch (e) {}
    setLoading(false);
  };

  const loadMessages = async () => {
    if (!activeId) return;
    try {
      const list = await base44.entities.Message.filter({ conversation_id: activeId }, "created_date", 200);
      setMessages(list || []);
    } catch (e) {}
  };

  useEffect(() => { loadConversations(); }, [role, myProfileId]);
  useEffect(() => {
    loadMessages();
    const t = setInterval(loadMessages, 4000);
    return () => clearInterval(t);
  }, [activeId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !activeId) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;
    const content = text.trim();
    setText("");
    try {
      await base44.entities.Message.create({
        conversation_id: activeId,
        sender_id: myProfileId,
        sender_role: role,
        content,
        read: false
      });
      await base44.entities.Conversation.update(activeId, {
        last_message: content,
        last_message_at: new Date().toISOString()
      });
      loadMessages();
      loadConversations();
    } catch (e) {
      alert(e.message || "Failed to send");
    }
  };

  const reportConv = async () => {
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;
    setReporting(true);
    try {
      await base44.entities.Report.create({
        reporter_id: myProfileId,
        reporter_name: role === "student" ? studentProfile.full_name : companyProfile.company_name,
        reported_type: "message",
        reported_id: activeId,
        reported_name: `Conversation with ${role === "student" ? conv.company_name : conv.student_name}`,
        reason: "Inappropriate messages",
        description: "User flagged this conversation for moderation.",
        status: "pending"
      });
      alert("Report submitted. Admins will review the conversation.");
    } catch (e) {}
    setReporting(false);
  };

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <PageHeader title="Messages" subtitle="Chat with companies and students you're connected with." />
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[600px]">
        {/* Conversation list */}
        <div className={`border-r border-border overflow-y-auto ${activeId ? "hidden md:block" : ""}`}>
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : conversations.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No conversations" description="Conversations start after you apply or receive an application." />
          ) : (
            conversations.map((c) => (
              <button key={c.id} onClick={() => setActiveId(c.id)} className={`w-full text-left p-4 border-b border-border hover:bg-slate-50 ${activeId === c.id ? "bg-indigo-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-500">
                    {role === "student" ? <Building2 className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{role === "student" ? c.company_name : c.student_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.last_message || "No messages yet"}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat */}
        <div className={`md:col-span-2 flex flex-col ${activeId ? "" : "hidden md:flex"}`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a conversation</div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <button className="md:hidden p-1" onClick={() => setActiveId(null)}><ArrowLeft className="w-5 h-5" /></button>
                  <div>
                    <p className="font-semibold">{role === "student" ? activeConv.company_name : activeConv.student_name}</p>
                    {activeConv.job_title && <p className="text-xs text-muted-foreground">{activeConv.job_title}</p>}
                  </div>
                </div>
                <button onClick={reportConv} className="text-xs text-rose-600 hover:underline inline-flex items-center gap-1" disabled={reporting}><Flag className="w-3.5 h-3.5" /> Report</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.map((m) => {
                  const mine = m.sender_id === myProfileId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${mine ? "bg-indigo-600 text-white" : "bg-white border border-border"}`}>
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                        <p className={`text-[10px] mt-1 ${mine ? "text-indigo-200" : "text-muted-foreground"}`}>{new Date(m.created_date).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Type a message…" />
                <Button onClick={send}><Send className="w-4 h-4" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
