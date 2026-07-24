import React from "react";
import { Construction } from "lucide-react";
import PageHeader from '@views/components/shared/PageHeader';
import { APP_CARD_LG, APP_PAGE_CONTENT, APP_PAGE_SHELL } from '@views/components/ui/design-system';

export default function AdminComingSoonPage() {
  return (
    <div className={APP_PAGE_SHELL}>
      <div className={APP_PAGE_CONTENT}>
      <PageHeader
        title="Admin Settings"
        subtitle="ส่วนของการตั้งค่าระบบ"
      />
      
      <div className={`${APP_CARD_LG} flex min-h-[50vh] flex-col items-center justify-center p-16 text-center`}>
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
    </div>
  );
}
