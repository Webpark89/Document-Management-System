import React from "react";
import { Construction } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

export default function AdminComingSoonPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader
        title="Admin Settings"
        subtitle="ส่วนของการตั้งค่าระบบ"
      />
      
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center p-16 text-center min-h-[50vh]">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
          <Construction className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">ส่วนนี้เป็นหน้าที่ของ Developer B</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          หน้า Admin/Config (Master Data, Roles, Users) 
          กำลังอยู่ในระหว่างการพัฒนาโดย Developer B (Coming Soon)
        </p>
      </div>
    </div>
  );
}
