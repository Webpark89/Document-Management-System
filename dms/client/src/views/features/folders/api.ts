import { api } from "@/lib";
import { Folder, CreateFolderPayload, UpdateFolderPayload, MoveDocumentPayload } from "./types";

export async function getFolders(): Promise<Folder[]> {
  try {
    const res = await api.get<Folder[]>("/api/folders");
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch folders:", err);
    return [];
  }
}

export async function getFolderById(id: string): Promise<Folder | null> {
  try {
    const res = await api.get<Folder>(`/api/folders/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Failed to fetch folder ${id}:`, err);
    return null;
  }
}

export async function createFolder(payload: CreateFolderPayload): Promise<Folder> {
  const res = await api.post<Folder>("/api/folders", payload);
  return res.data;
}

export async function updateFolder(id: string, payload: UpdateFolderPayload): Promise<Folder> {
  const res = await api.put<Folder>(`/api/folders/${id}`, payload);
  return res.data;
}

export async function deleteFolder(id: string): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/api/folders/${id}`);
  return res.data;
}

export async function moveDocumentToFolder(payload: MoveDocumentPayload): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>("/api/folders/move-doc", payload);
  return res.data;
}
