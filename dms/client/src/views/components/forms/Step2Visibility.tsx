import React from "react";
import { UploadCloud, Globe, Building, Users } from "lucide-react";

export interface VisibilityData {
  type: "CompanyWide" | "Department" | "SpecificUsers";
  departments: string[];
  users: string[];
}

interface Step2VisibilityProps {
  uploadedFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  visibility: VisibilityData;
  onVisibilityChange: (data: VisibilityData) => void;
  isRequired?: boolean;
}

const DEPARTMENTS = ["แผนกจัดซื้อ", "แผนกบัญชีและการเงิน", "แผนกคลังสินค้าและจัดส่ง", "แผนกเทคโนโลยีสารสนเทศ", "แผนกทรัพยากรบุคคล", "แผนกผลิต"];

export default function Step2Visibility({
  uploadedFile,
  onFileChange,
  visibility,
  onVisibilityChange,
  isRequired = false
}: Step2VisibilityProps) {
  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [userSearch, setUserSearch] = React.useState("");

  React.useEffect(() => {
    import("@/controllers/services/admin.service").then(({ adminService }) => {
      adminService.getUsersList().then((res) => {
        setUsersList((res || []).filter((u: any) => u.is_active));
      }).catch(() => {});
    });
  }, []);
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
          Attach Reference Document (แนบไฟล์เอกสารอ้างอิง) {isRequired && <span className="text-rose-500">*</span>}
        </label>
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50/50 transition-colors cursor-pointer relative bg-white">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={onFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-blue-50 rounded-full text-blue-600">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-base font-bold text-slate-700">
              {uploadedFile ? uploadedFile.name : "คลิก หรือ ลากไฟล์เอกสารมาวางที่นี่"}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              รองรับไฟล์ PDF, DOC, DOCX (ขนาดสูงสุดไม่เกิน 25MB)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
          กำหนดสิทธิการมองเห็นเอกสาร (Document Visibility)
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onVisibilityChange({ ...visibility, type: "CompanyWide" })}
            className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all cursor-pointer ${
              visibility.type === "CompanyWide"
                ? "border-blue-600 bg-blue-50/30 ring-2 ring-blue-600/10 text-blue-700"
                : "border-slate-200 hover:bg-white text-slate-600"
            }`}
          >
            <Globe className="w-6 h-6" />
            <span className="text-sm font-bold">ทุกคนในระบบ</span>
            <span className="text-[10px] text-slate-500 font-medium">Company Wide</span>
          </button>
          
          <button
            type="button"
            onClick={() => onVisibilityChange({ ...visibility, type: "Department" })}
            className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all cursor-pointer ${
              visibility.type === "Department"
                ? "border-purple-600 bg-purple-50/30 ring-2 ring-purple-600/10 text-purple-700"
                : "border-slate-200 hover:bg-white text-slate-600"
            }`}
          >
            <Building className="w-6 h-6" />
            <span className="text-sm font-bold">ระบุแผนก</span>
            <span className="text-[10px] text-slate-500 font-medium">Specific Departments</span>
          </button>
          
          <button
            type="button"
            onClick={() => onVisibilityChange({ ...visibility, type: "SpecificUsers" })}
            className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all cursor-pointer ${
              visibility.type === "SpecificUsers"
                ? "border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-600/10 text-emerald-700"
                : "border-slate-200 hover:bg-white text-slate-600"
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-sm font-bold">ระบุบุคคล</span>
            <span className="text-[10px] text-slate-500 font-medium">Specific Users</span>
          </button>
        </div>

        {visibility.type === "Department" && (
          <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl">
            <p className="text-xs font-bold text-slate-500 mb-2">เลือกแผนกที่สามารถเห็นเอกสารได้:</p>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map(dept => {
                const isSelected = visibility.departments.includes(dept);
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => {
                      const newDepts = isSelected
                        ? visibility.departments.filter(d => d !== dept)
                        : [...visibility.departments, dept];
                      onVisibilityChange({ ...visibility, departments: newDepts });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      isSelected 
                        ? "bg-purple-100 border-purple-300 text-purple-700" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {visibility.type === "SpecificUsers" && (
          <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl relative">
            <p className="text-xs font-bold text-slate-500 mb-2">เลือกผู้ใช้งานที่สามารถเห็นเอกสารได้:</p>
            
            {/* Selected Users */}
            <div className="flex flex-wrap gap-2 mb-3">
              {visibility.users.map(username => {
                const u = usersList.find(x => x.username === username);
                const displayName = u ? `${u.first_name} ${u.last_name}` : username;
                return (
                  <span key={username} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                    {displayName}
                    <button type="button" onClick={() => onVisibilityChange({...visibility, users: visibility.users.filter(x => x !== username)})} className="hover:text-emerald-900 cursor-pointer text-base leading-none">&times;</button>
                  </span>
                )
              })}
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="พิมพ์ค้นหาชื่อผู้ใช้งานเพื่อเพิ่ม..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {userSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                  {usersList.filter(u => 
                    !visibility.users.includes(u.username) && 
                    (u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
                     `${u.first_name} ${u.last_name}`.toLowerCase().includes(userSearch.toLowerCase()))
                  ).map(u => (
                    <div 
                      key={u.id}
                      onClick={() => {
                        onVisibilityChange({ ...visibility, users: [...visibility.users, u.username] });
                        setUserSearch("");
                      }}
                      className="px-3 py-2 hover:bg-slate-50 text-xs font-bold cursor-pointer text-slate-700 border-b border-slate-50 last:border-0"
                    >
                      {u.first_name} {u.last_name} <span className="text-slate-400 font-normal">(@{u.username})</span>
                    </div>
                  ))}
                  {usersList.filter(u => !visibility.users.includes(u.username) && (u.username.toLowerCase().includes(userSearch.toLowerCase()) || `${u.first_name} ${u.last_name}`.toLowerCase().includes(userSearch.toLowerCase()))).length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-400 text-center">ไม่พบผู้ใช้งาน</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
