import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/profile";
import { adminNotify } from "@/lib/notify";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Loader2, Upload, CheckCircle2, Save, RefreshCw } from "lucide-react";

const ORG_TYPES = ["Private", "Public", "NGO", "Government", "Other"];

export default function CompanyProfilePage() {
  const { companyProfile } = useProfile();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (companyProfile) setForm({ ...companyProfile });
  }, [companyProfile]);

  if (!companyProfile || !form) return null;

  const f = (key) => ({ value: form[key] || "", onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  const uploadLogo = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, logo_url: file_url });
  };

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.CompanyProfile.update(companyProfile.id, { ...form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const resubmit = async () => {
    setResubmitting(true);
    try {
      await base44.entities.CompanyProfile.update(companyProfile.id, { verification_status: "pending" });
      await adminNotify("company_verification", "Company resubmitted for verification", `${form.company_name} resubmitted for review.`, "CompanyProfile", companyProfile.id);
      setForm({ ...form, verification_status: "pending" });
    } catch (e) {
      alert(e.message || "Failed");
    } finally {
      setResubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <PageHeader
        title="Company Profile"
        subtitle="Keep your company information up to date."
        actions={<div className="flex items-center gap-2"><StatusBadge status={form.verification_status} />{saved && <span className="text-sm text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}</div>}
      />

      {form.verification_status === "rejected" && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3">
          <p className="text-sm text-rose-700">Your verification was rejected. Update your information and resubmit.</p>
          <Button size="sm" onClick={resubmit} disabled={resubmitting}>{resubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />} Resubmit</Button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-4">
          {form.logo_url ? <img src={form.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover" /> : <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 text-xl font-bold">{(form.company_name || "C").charAt(0)}</span>}
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm cursor-pointer hover:bg-slate-50"><Upload className="w-4 h-4" /> Upload logo<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadLogo(e.target.files[0])} /></label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Company name</Label><Input className="mt-1.5" {...f("company_name")} /></div>
          <div><Label>Email</Label><Input className="mt-1.5" {...f("email")} /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Phone</Label><Input className="mt-1.5" {...f("phone")} /></div>
          <div><Label>Website</Label><Input className="mt-1.5" {...f("website")} /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Organization type</Label>
            <Select value={form.org_type} onValueChange={(v) => setForm({ ...form, org_type: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Industry</Label><Input className="mt-1.5" {...f("industry")} /></div>
        </div>
        <div><Label>Location</Label><Input className="mt-1.5" {...f("location")} /></div>
        <div><Label>Description</Label><Textarea className="mt-1.5" rows={3} {...f("description")} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Contact person</Label><Input className="mt-1.5" {...f("contact_person")} /></div>
          <div><Label>Contact position</Label><Input className="mt-1.5" {...f("contact_position")} /></div>
        </div>
        <div><Label>Registration / legal info</Label><Textarea className="mt-1.5" rows={2} {...f("legal_info")} /></div>
        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save profile</Button>
        </div>
      </div>
    </div>
  );
}
