/**
 * Compatibility barrel — prefer `@/features/master-data` or `@/features/roles-users`.
 * Volatile runtime copies (Soft Create — reset on refresh):
 * - Signatures: SignatureProvider seeds from SIGNATURES
 * - Master Data tabs: page.tsx seeds from createInitialMasterTabData()
 * - Doc forms matrix: doc-forms/page.tsx seeds from APPROVAL_MATRIX
 * - Running numbers: DocumentRunningTab seeds from getRunningConfigs() / RUNNING_CONFIGS
 */
export * from "@/features/master-data";
export * from "@/features/roles-users";
