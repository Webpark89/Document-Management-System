import useSWR from "swr";
import { documentsService } from "../services/documents.service";

export function useDocuments() {
  const { data, error, mutate, isLoading } = useSWR(
    "/api/documents",
    () => documentsService.getDocuments()
  );

  return {
    documents: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
