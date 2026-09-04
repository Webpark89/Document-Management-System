"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DocFormsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/master-data");
  }, [router]);

  return null;
}
