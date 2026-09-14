const fs = require('fs');
const file = 'client/src/views/components/forms/ApprovalWorkflowSection.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'interface ApprovalWorkflowSectionProps {\n  steps: WorkflowStepInput[];\n  onChange: (steps: WorkflowStepInput[]) => void;\n}',
  'interface ApprovalWorkflowSectionProps {\n  steps: WorkflowStepInput[];\n  onChange: (steps: WorkflowStepInput[]) => void;\n  documentPrefix?: string;\n}'
);

content = content.replace(
  'export default function ApprovalWorkflowSection({\n  steps,\n  onChange,\n}: ApprovalWorkflowSectionProps) {',
  'export default function ApprovalWorkflowSection({\n  steps,\n  onChange,\n  documentPrefix,\n}: ApprovalWorkflowSectionProps) {'
);

const hardcodedLogic = `  // Auto-fill empty or unassigned steps when users load or steps change
  useEffect(() => {
    if (users.length === 0) return;

    let currentSteps = steps;
    if (!currentSteps || currentSteps.length === 0) {
      currentSteps = [
        { id: "1", stepOrder: 1, roleName: "ผู้จัดการแผนก (Department Manager)", approverName: "" },
        { id: "2", stepOrder: 2, roleName: "ผู้อนุมัติ / ผู้บริหาร (Executive/Director)", approverName: "" },
      ];
    }`;

const dynamicLogic = `  const [workflows, setWorkflows] = useState<any[]>([]);

  useEffect(() => {
    adminService
      .getApprovalWorkflowsList()
      .then((res) => setWorkflows(res || []))
      .catch(() => {});
  }, []);

  // Auto-fill empty or unassigned steps when users load or steps change
  useEffect(() => {
    if (users.length === 0) return;

    let currentSteps = steps;
    if (!currentSteps || currentSteps.length === 0) {
      if (documentPrefix && workflows.length > 0) {
        const wf = workflows.find((w) => w.prefix === documentPrefix);
        if (wf && wf.steps && wf.steps.length > 0) {
          currentSteps = wf.steps.map((role: string, idx: number) => ({
            id: String(idx + 1),
            stepOrder: idx + 1,
            roleName: role,
            approverName: ""
          }));
        }
      }
      
      // Fallback
      if (!currentSteps || currentSteps.length === 0) {
        currentSteps = [
          { id: "1", stepOrder: 1, roleName: "ผู้จัดการแผนก (Department Manager)", approverName: "" },
          { id: "2", stepOrder: 2, roleName: "ผู้อนุมัติ / ผู้บริหาร (Executive/Director)", approverName: "" },
        ];
      }
    }`;

content = content.replace(hardcodedLogic, dynamicLogic);

// Add passing documentPrefix to PRForm, POForm, BKForm
const forms = [
  { path: 'client/src/views/components/forms/PRForm.tsx', prefix: 'PR' },
  { path: 'client/src/views/components/forms/POForm.tsx', prefix: 'PO' },
  { path: 'client/src/views/components/forms/BKForm.tsx', prefix: 'BK' }
];

forms.forEach(f => {
  if (fs.existsSync(f.path)) {
    let fContent = fs.readFileSync(f.path, 'utf8');
    fContent = fContent.replace(
      '<ApprovalWorkflowSection\n        steps={workflowSteps}\n        onChange={setWorkflowSteps}\n      />',
      `<ApprovalWorkflowSection\n        steps={workflowSteps}\n        onChange={setWorkflowSteps}\n        documentPrefix="${f.prefix}"\n      />`
    );
    fContent = fContent.replace(
      '<ApprovalWorkflowSection steps={workflowSteps} onChange={setWorkflowSteps} />',
      `<ApprovalWorkflowSection steps={workflowSteps} onChange={setWorkflowSteps} documentPrefix="${f.prefix}" />`
    );
    fs.writeFileSync(f.path, fContent, 'utf8');
  }
});

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed workflow dynamic loading!');
