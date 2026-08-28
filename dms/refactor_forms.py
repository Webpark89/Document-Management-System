import os

base_path = r'd:\Document Management\dms\client\src\views\components\forms'
forms = ['PRForm.tsx', 'POForm.tsx', 'BKForm.tsx']

for form in forms:
    filepath = os.path.join(base_path, form)
    if not os.path.exists(filepath): continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Imports
    if 'Step2Visibility' not in content:
        content = content.replace('import ApprovalWorkflowSection, {', 'import Step2Visibility, { VisibilityData } from "./Step2Visibility";\nimport ApprovalWorkflowSection, {')

    # Props
    if 'currentStep: number' not in content:
        content = content.replace('runningNumberPreview: string;', 'runningNumberPreview: string;\n  currentStep: number;\n  onNext: () => void;\n  onBack: () => void;')
        
    if 'currentStep, onNext, onBack' not in content:
        content = content.replace('}: PRFormProps) {', ', currentStep, onNext, onBack }: PRFormProps) {')
        content = content.replace('}: POFormProps) {', ', currentStep, onNext, onBack }: POFormProps) {')
        content = content.replace('}: BKFormProps) {', ', currentStep, onNext, onBack }: BKFormProps) {')
        
    if 'const [visibility' not in content:
        content = content.replace('const [workflowSteps, setWorkflowSteps]', 'const [visibility, setVisibility] = useState<VisibilityData>({ type: "CompanyWide", departments: [], users: [] });\n  const [workflowSteps, setWorkflowSteps]')

    # Add visibility to submit data payload
    if 'visibility,' not in content and 'visibility: ' not in content:
        content = content.replace('workflowSteps,\n      isDraft,', 'visibility,\n      workflowSteps,\n      isDraft,')

    # Step Wrappers
    if '{currentStep === 1' not in content:
        # PR / PO / BK all start with <div className="flex justify-between items-center bg-slate-50
        content = content.replace(
            '<div className="flex justify-between items-center bg-slate-50',
            '{currentStep === 1 && (\n        <>\n      <div className="flex justify-between items-center bg-slate-50'
        )
        
        # End step 1 before Attachment section which starts with <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mt-4">
        # Replace this div up to the Workflow Matrix Selection
        
        parts = content.split('<div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mt-4">')
        if len(parts) == 2:
            part1 = parts[0]
            part2 = parts[1]
            
            workflow_split = part2.split('{/* WORKFLOW MATRIX SELECTION */}')
            if len(workflow_split) == 2:
                attachment_html = workflow_split[0]
                rest = workflow_split[1]
                
                new_step1_end = '''
          <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer"
            >
              Next Step (ถัดไป)
            </button>
          </div>
        </>
      )}
'''
                new_step2 = '''
      {currentStep === 2 && (
        <>
          <Step2Visibility
            uploadedFile={uploadedFile}
            onFileChange={handleFileChange}
            visibility={visibility}
            onVisibilityChange={setVisibility}
          />
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              Back (ย้อนกลับ)
            </button>
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer"
            >
              Next Step (ถัดไป)
            </button>
          </div>
        </>
      )}
'''
                new_step3_start = '''
      {currentStep === 3 && (
        <>
          {/* WORKFLOW MATRIX SELECTION */}
'''
                content = part1 + new_step1_end + new_step2 + new_step3_start + rest
                
                # Replace Cancel button with Back button in step 3
                content = content.replace(
                    '''<button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all cursor-pointer"
        >
          Cancel
        </button>''',
                    '''<button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all cursor-pointer"
        >
          Back (ย้อนกลับ)
        </button>'''
                )
                
                content = content.replace('</form>', '      </>\n      )}\n    </form>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
# Special handling for UploadOnlyForm
upload_only = os.path.join(base_path, 'UploadOnlyForm.tsx')
if os.path.exists(upload_only):
    with open(upload_only, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'Step2Visibility' not in content:
        content = content.replace('import ApprovalWorkflowSection, {', 'import Step2Visibility, { VisibilityData } from "./Step2Visibility";\nimport ApprovalWorkflowSection, {')

    if 'currentStep: number' not in content:
        content = content.replace('runningNumberPreview: string;', 'runningNumberPreview: string;\n  currentStep: number;\n  onNext: () => void;\n  onBack: () => void;')
        
    if 'currentStep, onNext, onBack' not in content:
        content = content.replace('}: UploadOnlyFormProps) {', ', currentStep, onNext, onBack }: UploadOnlyFormProps) {')
        
    if 'const [visibility' not in content:
        content = content.replace('const [workflowSteps, setWorkflowSteps]', 'const [visibility, setVisibility] = useState<VisibilityData>({ type: "CompanyWide", departments: [], users: [] });\n  const [workflowSteps, setWorkflowSteps]')

    if 'visibility,' not in content and 'visibility: ' not in content:
        content = content.replace('workflowSteps,\n      isDraft,', 'visibility,\n      workflowSteps,\n      isDraft,')
        
    if '{currentStep === 1' not in content:
        content = content.replace(
            '{/* HEADER METADATA */}',
            '{currentStep === 1 && (\n        <>\n      {/* HEADER METADATA */}'
        )
        
        parts = content.split('<!-- FILE UPLOAD ATTACHMENT -->')
        # Wait, the comment in UploadOnlyForm is {/* FILE UPLOAD ATTACHMENT */}
        parts = content.split('{/* FILE UPLOAD ATTACHMENT */}')
        if len(parts) == 2:
            part1 = parts[0]
            part2 = parts[1]
            
            workflow_split = part2.split('{/* WORKFLOW MATRIX SELECTION */}')
            if len(workflow_split) == 2:
                attachment_html = workflow_split[0]
                rest = workflow_split[1]
                
                new_step1_end = '''
          <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer"
            >
              Next Step (ถัดไป)
            </button>
          </div>
        </>
      )}

      {currentStep === 2 && (
        <>
          <Step2Visibility
            uploadedFile={uploadedFile}
            onFileChange={handleFileChange}
            visibility={visibility}
            onVisibilityChange={setVisibility}
            isRequired={true}
          />
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              Back (ย้อนกลับ)
            </button>
            <button
              type="button"
              onClick={() => {
                if (!uploadedFile) { alert("กรุณาแนบไฟล์เอกสาร"); return; }
                onNext();
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer"
            >
              Next Step (ถัดไป)
            </button>
          </div>
        </>
      )}

      {currentStep === 3 && (
        <>
          {/* WORKFLOW MATRIX SELECTION */}
'''
                content = part1 + new_step1_end + new_step3_start.replace('      {currentStep === 3 && (\n        <>\n          {/* WORKFLOW MATRIX SELECTION */}', new_step1_end + new_step2 + new_step3_start) 
                
                # Let's fix that
                content = part1 + new_step1_end + new_step2 + '''      {currentStep === 3 && (\n        <>\n          {/* WORKFLOW MATRIX SELECTION */}''' + rest
                
                content = content.replace(
                    '''<button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all cursor-pointer"
        >
          Cancel
        </button>''',
                    '''<button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm transition-all cursor-pointer"
        >
          Back (ย้อนกลับ)
        </button>'''
                )
                
                content = content.replace('</form>', '      </>\n      )}\n    </form>')

    with open(upload_only, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
