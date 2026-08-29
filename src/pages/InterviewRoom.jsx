import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Mic, MicOff, VideoOff, PhoneOff, Send, MessageSquare, Info, ArrowLeft } from "lucide-react";

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, studentProfile, companyProfile } = useProfile();
  const [iv, setIv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const endRef = useRef(null);
  const myId = role === "student" ? studentProfile?.id : companyProfile?.id;

  useEffect(() => {
    let active = true;
    base44.entities.Interview.get(id).then((data) => { if (active) setIv(data); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    const loadMsgs = () => base44.entities.Message.filter({ conversation_id: id }, "created_date", 200).then((m) => setMessages(m || [])).catch(() => {});
    loadMsgs();
    const t = setInterval(loadMsgs, 3000);
    return () => { active = false; clearInterval(t); };
  }, [id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    await base44.entities.Message.create({ conversation_id: id, sender_id: myId, sender_role: role, content, read: false });
    const m = await base44.entities.Message.filter({ conversation_id: id }, "created_date", 200);
    setMessages(m || []);
  };

  if (loading) return <div className="p-10"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  if (!iv) return <div className="p-10 text-center text-muted-foreground">Interview not found.</div>;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <button onClick={() => navigate("/interviews")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to interviews
      </button>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{iv.job_title}</h1>
          <p className="text-sm text-muted-foreground">{role === "student" ? iv.company_name : iv.student_name} · {iv.date} {iv.time}</p>
        </div>
        <StatusBadge status={iv.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Video stage */}
        <div className="lg:col-span-2">
          <div className="relative bg-slate-900 rounded-2xl aspect-video flex items-center justify-center overflow-hidden">
            <div className="text-center text-slate-400 px-6">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-60" />
              <p className="font-medium text-slate-300">Online interview room</p>
              <p className="text-sm mt-1 max-w-md">
                This stage is ready to connect a video provider (WebRTC / meeting SDK).
                Audio/video calls plug in here — chat and controls below work now.
              </p>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button onClick={() => setMicOn(!micOn)} className={`w-12 h-12 rounded-full flex items-center justify-center ${micOn ? "bg-slate-700 text-white" : "bg-rose-600 text-white"}`}>
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button onClick={() => setCamOn(!camOn)} className={`w-12 h-12 rounded-full flex items-center justify-center ${camOn ? "bg-slate-700 text-white" : "bg-rose-600 text-white"}`}>
                {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button onClick={() => navigate("/interviews")} className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center">
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
          {iv.instructions && (
            <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-2">
              <Info className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <p className="text-sm text-indigo-900">{iv.instructions}</p>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="bg-white rounded-2xl border border-border flex flex-col h-[500px]">
          <div className="p-4 border-b border-border font-semibold flex items-center gap-2 text-sm"><MessageSquare className="w-4 h-4" /> Interview chat</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No messages yet. Say hello 👋</p>}
            {messages.map((m) => {
              const mine = m.sender_id === myId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${mine ? "bg-indigo-600 text-white" : "bg-slate-100"}`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p className={`text-[10px] mt-0.5 ${mine ? "text-indigo-200" : "text-muted-foreground"}`}>{new Date(m.created_date).toLocaleTimeString()}</p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Message…" />
            <Button onClick={send} size="icon"><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
