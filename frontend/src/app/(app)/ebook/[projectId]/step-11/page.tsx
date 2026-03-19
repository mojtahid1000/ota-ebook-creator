"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WizardNav } from "@/components/layout/wizard-nav";
import {
  FileText, Download, Loader2, Check, AlertTriangle, Settings,
} from "lucide-react";



const FONT_OPTIONS = [
  { id: "Hind Siliguri", bn: "হিন্দ সিলিগুড়ি (আধুনিক)" },
  { id: "Noto Sans Bengali", bn: "নোটো সানস বেঙ্গলি" },
  { id: "Kalpurush", bn: "কল্পুরুষ (ঐতিহ্যবাহী)" },
  { id: "SolaimanLipi", bn: "সোলায়মানলিপি (ক্লাসিক)" },
];

const HEADER_OPTIONS = [
  { id: "minimal", bn: "মিনিমাল" },
  { id: "branded", bn: "ব্র্যান্ডেড (OTA)" },
  { id: "bold_line", bn: "বোল্ড লাইন" },
  { id: "none", bn: "কোনো হেডার নেই" },
];

const FOOTER_OPTIONS = [
  { id: "standard", bn: "স্ট্যান্ডার্ড (লেখক | পেজ | ওয়েব)" },
  { id: "minimal", bn: "শুধু পেজ নম্বর" },
  { id: "branded", bn: "ব্র্যান্ডেড" },
  { id: "copyright", bn: "কপিরাইট স্টাইল" },
];

const MARGIN_OPTIONS = [
  { id: "narrow", bn: "সরু (0.5in)" },
  { id: "standard", bn: "স্ট্যান্ডার্ড (0.75in)" },
  { id: "wide", bn: "প্রশস্ত (1in)" },
];

type ExportResult = { format: string; filename: string; download_url: string; size_bytes: number };

export default function Step11ExportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();

  const [font, setFont] = useState("Hind Siliguri");
  const [headerStyle, setHeaderStyle] = useState("minimal");
  const [footerStyle, setFooterStyle] = useState("standard");
  const [margins, setMargins] = useState("standard");
  const [showDesign, setShowDesign] = useState(false);

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingDocx, setGeneratingDocx] = useState(false);
  const [pdfResult, setPdfResult] = useState<ExportResult | null>(null);
  const [docxResult, setDocxResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState("");

  async function buildExportData() {
    const { data: project } = await supabase.from("ebook_projects").select("*").eq("id", projectId).single();
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
    const { data: chapters } = await supabase.from("ebook_chapters").select("*").eq("project_id", projectId).order("chapter_number");

    return {
      project_id: projectId,
      title: project?.title || "Untitled Ebook",
      subtitle: project?.subtitle || "",
      author: profile?.author_name || user?.email || "Author",
      press: profile?.press_name || "OTA Press",
      website: profile?.website_url || "www.onlinetechacademy.com",
      chapters: (chapters || []).map((ch: Record<string, unknown>) => ({
        title: ch.title,
        content: ch.content || "",
      })),
      design_settings: { font, header_style: headerStyle, footer_style: footerStyle, margins },
      book_description: project?.review_data?.book_description || "",
      about_author: `${profile?.author_name || "Author"} - Published by ${profile?.press_name || "OTA Press"}`,
    };
  }

  async function exportPdf() {
    setGeneratingPdf(true);
    setError("");
    try {
      const data = await buildExportData();
      const res = await fetch(`/api/exports/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        // Open HTML in new window for print-to-PDF
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(result.html);
          printWindow.document.close();
          setTimeout(() => printWindow.print(), 1000);
        }
        setPdfResult({ format: "pdf", filename: result.filename, download_url: "", size_bytes: 0 });
      } else {
        setError("PDF তৈরি করতে ব্যর্থ");
      }
    } catch { setError("সার্ভার সংযোগ ব্যর্থ"); }
    setGeneratingPdf(false);
  }

  async function exportDocx() {
    setGeneratingDocx(true);
    setError("");
    try {
      const data = await buildExportData();
      const res = await fetch(`/api/exports/docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          // Error response
          const errData = await res.json();
          setError(errData.error || "DOCX তৈরি করতে ব্যর্থ");
        } else {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          const filename = `${data.title.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, "_")}.docx`;
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setDocxResult({ format: "docx", filename, download_url: "", size_bytes: blob.size });
        }
      } else {
        try {
          const errData = await res.json();
          setError(errData.error || "DOCX তৈরি করতে ব্যর্থ");
        } catch {
          setError(`DOCX তৈরি করতে ব্যর্থ (${res.status})`);
        }
      }
    } catch (err) {
      console.error("DOCX export error:", err);
      setError("সার্ভার সংযোগ ব্যর্থ");
    }
    setGeneratingDocx(false);
  }

  async function handleConfirm() {
    await supabase.from("ebook_projects").update({
      current_step: 12, status: "exported", updated_at: new Date().toISOString(),
    }).eq("id", projectId);
    router.push(`/ebook/${projectId}/step-12`);
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-ota-blue">ধাপ ১১: এক্সপোর্ট</h2>
        <p className="text-slate-500 mt-1">আপনার ইবুক PDF বা DOCX ফরম্যাটে ডাউনলোড করুন</p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Design Settings Toggle */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setShowDesign(!showDesign)} size="sm">
            <Settings className="w-4 h-4" /> ডিজাইন সেটিংস {showDesign ? "▲" : "▼"}
          </Button>

          {showDesign && (
            <div className="mt-4 bg-slate-50 rounded-xl p-5 space-y-5 border">
              {/* Font */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">ফন্ট নির্বাচন</h4>
                <div className="grid grid-cols-2 gap-2">
                  {FONT_OPTIONS.map((f) => (
                    <Card key={f.id} selected={font === f.id} onClick={() => setFont(f.id)} className="py-2 px-3 text-center">
                      <p className="text-sm">{f.bn}</p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Header */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">হেডার স্টাইল</h4>
                <div className="grid grid-cols-2 gap-2">
                  {HEADER_OPTIONS.map((h) => (
                    <Card key={h.id} selected={headerStyle === h.id} onClick={() => setHeaderStyle(h.id)} className="py-2 px-3 text-center">
                      <p className="text-sm">{h.bn}</p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">ফুটার স্টাইল</h4>
                <div className="grid grid-cols-2 gap-2">
                  {FOOTER_OPTIONS.map((f) => (
                    <Card key={f.id} selected={footerStyle === f.id} onClick={() => setFooterStyle(f.id)} className="py-2 px-3 text-center">
                      <p className="text-sm">{f.bn}</p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Margins */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">মার্জিন</h4>
                <div className="grid grid-cols-3 gap-2">
                  {MARGIN_OPTIONS.map((m) => (
                    <Card key={m.id} selected={margins === m.id} onClick={() => setMargins(m.id)} className="py-2 px-3 text-center">
                      <p className="text-sm">{m.bn}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PDF */}
          <div className="bg-white border-2 border-red-100 rounded-xl p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">PDF</h3>
            <p className="text-sm text-slate-500 mb-4">প্রফেশনাল PDF ইবুক</p>

            {pdfResult ? (
              <div>
                <p className="text-sm text-ota-teal flex items-center justify-center gap-1 mb-3">
                  <Check className="w-4 h-4" /> প্রিন্ট উইন্ডো খোলা হয়েছে
                </p>
                <Button onClick={exportPdf} size="md">
                  <Download className="w-4 h-4" /> আবার প্রিন্ট করুন
                </Button>
              </div>
            ) : (
              <Button onClick={exportPdf} loading={generatingPdf} variant="outline" size="md">
                {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                PDF তৈরি করুন
              </Button>
            )}
          </div>

          {/* DOCX */}
          <div className="bg-white border-2 border-blue-100 rounded-xl p-6 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-7 h-7 text-blue-500" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">DOCX</h3>
            <p className="text-sm text-slate-500 mb-4">Word ডকুমেন্ট ফরম্যাট</p>

            {docxResult ? (
              <div>
                <p className="text-sm text-ota-teal flex items-center justify-center gap-1 mb-3">
                  <Check className="w-4 h-4" /> তৈরি হয়েছে ({Math.round(docxResult.size_bytes / 1024)}KB)
                </p>
                <Button onClick={exportDocx} variant="secondary" size="md">
                  <Download className="w-4 h-4" /> আবার ডাউনলোড করুন
                </Button>
              </div>
            ) : (
              <Button onClick={exportDocx} loading={generatingDocx} variant="outline" size="md">
                {generatingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                DOCX তৈরি করুন
              </Button>
            )}
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-500 text-center"><AlertTriangle className="w-4 h-4 inline mr-1" />{error}</p>}

        <WizardNav
          currentStep={11}
          isConfirmed={false}
          canGoBack={true}
          canGoForward={!!(pdfResult || docxResult)}
          loading={false}
          onBack={() => router.push(`/ebook/${projectId}/step-10`)}
          onConfirm={handleConfirm}
          confirmLabel="কভার ডিজাইনে যান"
        />
      </div>
    </div>
  );
}
