const fs = require('fs');
const file = 'd:/Document Management/dms/client/src/views/components/documents/DocumentPreview.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const renderPRForm = \(\) => \{[\s\S]+?return renderA4Template\([\s\S]+?\);\s*\};/,
  `const renderPRForm = () => { const form = doc.pr_form; if (!form) return <div className="text-center p-8 text-slate-500">ไม่พบข้อมูล PR Form</div>; return <div className="w-full relative"><PRForm isViewer={true} initialData={doc} currentStep={1} runningNumberPreview={doc.doc_number || doc.id} onSubmit={() => {}} onCancel={() => {}} onNext={() => {}} onBack={() => {}} /></div>; };`
);

content = content.replace(
  /const renderPOForm = \(\) => \{[\s\S]+?return renderA4Template\([\s\S]+?\);\s*\};/,
  `const renderPOForm = () => { const form = doc.po_form; if (!form) return <div className="text-center p-8 text-slate-500">ไม่พบข้อมูล PO Form</div>; return <div className="w-full relative"><POForm isViewer={true} initialData={doc} currentStep={1} runningNumberPreview={doc.doc_number || doc.id} onSubmit={() => {}} onCancel={() => {}} onNext={() => {}} onBack={() => {}} /></div>; };`
);

content = content.replace(
  /const renderBKForm = \(\) => \{[\s\S]+?return \([\s\S]+?<\/A4Wrapper>\s*\);\s*\};/,
  `const renderBKForm = () => { return <div className="w-full relative"><BKForm isViewer={true} initialData={doc} currentStep={1} runningNumberPreview={doc.doc_number || doc.id} onSubmit={() => {}} onCancel={() => {}} onNext={() => {}} onBack={() => {}} /></div>; };`
);

fs.writeFileSync(file, content, 'utf8');
