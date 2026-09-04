"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Settings, Building2, MapPin, Save, FileText } from "lucide-react";
import {
  ADMIN_CONTENT,
  ADMIN_PAGE_SHELL,
  AdminPageHeader,
} from "@views/components/ui/admin";
import { useToast } from "@views/components/providers/ToastProvider";
import { api } from "@/lib";

export default function GeneralConfigPage() {
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get<any>("/api/admin/settings");
        const data = res.data;
        if (data) {
          setCompanyName(data.companyName || "");
          setCompanyAddress(data.companyAddress || "");
        }
      } catch (err: any) {
        console.error("Failed to load settings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post("/api/admin/settings", { companyName, companyAddress });
      showToast("บันทึกข้อมูลเรียบร้อยแล้ว", "success");
    } catch (err: any) {
      showToast(err.message || "เกิดข้อผิดพลาดในการบันทึก", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <AdminPageHeader 
        breadcrumb={
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-500">Config</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">General</span>
          </nav>
        }
        title="General Settings" 
        subtitle="ตั้งค่าทั่วไปของระบบและข้อมูลองค์กร"
      />

      <div className={ADMIN_CONTENT}>
        <div className="max-w-3xl mt-6">
          
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {/* Card Header */}
            <div className="px-6 py-6 sm:px-8 sm:py-8 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100/50">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">
                    ข้อมูลบริษัท (Company Identity)
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                    ข้อมูลที่ตั้งค่าในส่วนนี้จะถูกนำไปใช้เป็นส่วนหัว (Header) ของเอกสารแบบฟอร์มต่างๆ ภายในระบบโดยอัตโนมัติ เช่น ใบขอซื้อ (PR) และ ใบสั่งซื้อ (PO)
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-6 py-8 sm:px-8 flex-1">
              {isLoading ? (
                <div className="space-y-6 animate-pulse">
                  <div>
                    <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
                    <div className="h-12 w-full bg-slate-100 rounded-xl"></div>
                  </div>
                  <div>
                    <div className="h-4 w-48 bg-slate-200 rounded mb-2"></div>
                    <div className="h-32 w-full bg-slate-100 rounded-xl"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <FileText className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      ชื่อบริษัท (Company Name)
                    </label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal"
                      placeholder="เช่น บริษัท นิสซุย (ประเทศไทย) จำกัด"
                    />
                  </div>

                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                      <MapPin className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      ที่อยู่และเลขประจำตัวผู้เสียภาษี
                    </label>
                    <textarea 
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal leading-relaxed"
                      placeholder="เช่น เลขที่ 123 อาคารนิสซุย กรุงเทพมหานคร 10110&#10;เลขประจำตัวผู้เสียภาษี: 0105559000123"
                    />
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      * สามารถเว้นวรรคหรือขึ้นบรรทัดใหม่ได้ตามต้องการ ระบบจะแสดงผลตามรูปแบบที่จัดไว้
                    </p>
                  </div>

                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="bg-slate-50 px-6 py-4 sm:px-8 border-t border-slate-100 flex justify-end items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-[0.98]"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
                ) : (
                  <><Save className="w-4 h-4" /> บันทึกการเปลี่ยนแปลง</>
                )}
              </button>
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
}
