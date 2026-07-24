export interface Department {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Position {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface DocumentTypeEntity {
  id: string;
  type_name: string;
  prefix: string;
  is_active: boolean;
  created_at: string;
}

export type YearFormat = "YYYY" | "YY";

export interface RunningNumber {
  id: string;
  document_type_id: string;
  prefix: string;
  year_format: YearFormat;
  current_number: number;
  padding_length: number;
}

export interface RunningNumberWithType extends RunningNumber {
  document_type_name: string;
}

export type MasterDataEntity = "departments" | "positions" | "document-types";

export type CreateDepartmentInput = Pick<Department, "name">;
export type UpdateDepartmentInput = Partial<Pick<Department, "name" | "is_active">>;

export type CreatePositionInput = Pick<Position, "name">;
export type UpdatePositionInput = Partial<Pick<Position, "name" | "is_active">>;

export type CreateDocumentTypeInput = Pick<DocumentTypeEntity, "type_name" | "prefix">;
export type UpdateDocumentTypeInput = Partial<
  Pick<DocumentTypeEntity, "type_name" | "prefix" | "is_active">
>;

export type CreateRunningNumberInput = Pick<
  RunningNumber,
  "document_type_id" | "prefix" | "year_format" | "padding_length"
>;
export type UpdateRunningNumberInput = Partial<
  Pick<RunningNumber, "prefix" | "year_format" | "current_number" | "padding_length">
>;

export interface ApiListResponse<T> {
  data: T[];
  total: number;
}

export interface ApiItemResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: string;
}
