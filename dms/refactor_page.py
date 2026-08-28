import os
import re

filepath = r'd:\Document Management\dms\client\src\app\(main)\documents\upload\page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add currentStep
if 'const [currentStep, setCurrentStep]' not in content:
    content = content.replace(
        'const [docType, setDocType] = useState<FormType>("PR");',
        'const [docType, setDocType] = useState<FormType>("PR");\n  const [currentStep, setCurrentStep] = useState(1);'
    )

# Pass props
props = ' currentStep={currentStep} onNext={() => setCurrentStep(p => p + 1)} onBack={() => setCurrentStep(p => p - 1)}'

forms = ['PRForm', 'POForm', 'BKForm', 'UploadOnlyForm']
for form in forms:
    if f'{form}\n' in content or f'{form} ' in content:
        # Avoid duplicate passing
        if 'currentStep={currentStep}' not in content:
            content = content.replace(f'runningNumberPreview={{getRunningNumberPreview', f'{props.strip()}\n              runningNumberPreview={{getRunningNumberPreview')

# Add Wizard Stepper & Conditional render for type selector
if 'Stepper UI' not in content:
    stepper_ui = '''
      {/* WIZARD STEPPER */}
      <div className="mb-6 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-slate-100 -z-0 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-[10%] h-0.5 bg-blue-600 -z-0 -translate-y-1/2 transition-all duration-500" style={{ width: `${(currentStep - 1) * 40}%` }}></div>
        
        {[
          { step: 1, label: "กรอกข้อมูล", desc: "Select Type & Fill Form" },
          { step: 2, label: "แนบไฟล์และสิทธิ", desc: "Attachments & Visibility" },
          { step: 3, label: "สายการอนุมัติ", desc: "Workflow & Submit" }
        ].map((s) => (
          <div key={s.step} className="flex flex-col items-center relative z-10 bg-white px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${
              currentStep === s.step 
                ? "bg-blue-600 text-white ring-4 ring-blue-50" 
                : currentStep > s.step 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-100 text-slate-400"
            }`}>
              {currentStep > s.step ? "✓" : s.step}
            </div>
            <span className={`text-xs font-bold ${currentStep >= s.step ? "text-slate-800" : "text-slate-400"}`}>{s.label}</span>
            <span className="text-[10px] text-slate-400 hidden sm:block">{s.desc}</span>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
        {currentStep === 1 && (
'''
    # Replace `<div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">`
    content = content.replace('<div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">', stepper_ui)
    
    # Close the condition before {/* FORMS SECTION */}
    content = content.replace('{/* FORMS SECTION */}', ')}\n\n        {/* FORMS SECTION */}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
