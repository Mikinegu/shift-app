import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, BellOff } from "lucide-react";

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    try {
      const list = await base44.entities.Notification.filter({ user_id: user.id }, "-created_date", 100);
      setItems(list || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const markAllRead = async () => {
    const unread = items.filter((n) => !n.read);
    await base44.entities.Notification.bulkUpdate(unread.map((n) => ({ id: n.id, read: true })));
    load();
  };

  const markRead = async (n) => {
    await base44.entities.Notification.update(n.id, { read: true });
    load();
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle="Updates about your applications, interviews, and account."
        actions={items.some((n) => !n.read) && <Button variant="outline" onClick={markAllRead}><CheckCheck className="w-4 h-4 mr-2" /> Mark all read</Button>}
      />
      {loading ? (
        <div className="text-sm text-muted-foreground py-10">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState icon={BellOff} title="No notifications" description="You'll be notified here about applications, interviews, and decisions." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className={`bg-white rounded-xl border p-4 shadow-sm flex items-start gap-3 ${n.read ? "" : "border-indigo-200 bg-indigo-50/30"}`}>
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${n.read ? "bg-slate-100 text-slate-400" : "bg-indigo-100 text-indigo-600"}`}><Bell className="w-4 h-4" /></span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{n.title}</p>
                {n.description && <p className="text-sm text-muted-foreground mt-0.5">{n.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_date).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {!n.read && <button onClick={() => markRead(n)} className="text-xs text-indigo-600 hover:underline">Mark read</button>}
                {n.action_url && <Link to={n.action_url} className="text-xs text-indigo-600 hover:underline">View</Link>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
