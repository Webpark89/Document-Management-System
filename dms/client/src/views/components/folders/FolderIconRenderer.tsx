import React from 'react';
import { Folder as FolderIcon, Receipt, FileText, Megaphone, ShoppingBag } from 'lucide-react';

interface FolderIconRendererProps {
  iconName?: string;
  className?: string;
}

export function FolderIconRenderer({ iconName, className = "w-6 h-6" }: FolderIconRendererProps) {
  const name = iconName || "📁";
  
  if (name === "receipt") return <Receipt className={className} />;
  if (name === "file-text") return <FileText className={className} />;
  if (name === "megaphone") return <Megaphone className={className} />;
  if (name === "shopping-bag") return <ShoppingBag className={className} />;
  
  // If it's longer than 2 chars and not in the preset list, fallback to default Lucide Folder
  if (name.length > 2) return <FolderIcon className={className} />;
  
  // Otherwise it's likely an emoji
  return <span className={className.includes("w-6") ? "text-2xl" : "text-base"}>{name}</span>;
}
