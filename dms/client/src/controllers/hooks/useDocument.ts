import useSWR from "swr";
import { documentsService } from "../services/documents.service";

export function useDocument(id: string | undefined) {
  const { data, error, mutate, isLoading } = useSWR(
    id ? `/api/documents/${id}` : null,
    () => documentsService.getDocumentById(id!)
  );

  return {
    document: data,
    isLoading,
    isError: error,
    mutate,
  };
}
