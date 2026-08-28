import { IsString, IsOptional } from 'class-validator';

export class MoveDocumentDto {
  @IsString()
  document_id: string;

  @IsOptional()
  @IsString()
  target_folder_id?: string | null;
}
