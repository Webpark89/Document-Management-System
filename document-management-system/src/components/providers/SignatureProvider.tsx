"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { SIGNATURES, type SignatureRecord } from "@/features/master-data";

type AddSignatureInput = {
  approverName: string;
  position: string;
  imageUrl?: string;
};

type SignatureContextValue = {
  signatures: SignatureRecord[];
  addSignature: (input: AddSignatureInput) => SignatureRecord;
  updateSignature: (id: string, patch: Partial<Pick<SignatureRecord, "imageUrl" | "position">>) => void;
  findByApproverName: (name: string) => SignatureRecord | undefined;
};

const globalForSignature = globalThis as unknown as {
  SignatureContext: React.Context<SignatureContextValue | undefined>;
};

const SignatureContext =
  globalForSignature.SignatureContext || createContext<SignatureContextValue | undefined>(undefined);

if (process.env.NODE_ENV !== "production") {
  globalForSignature.SignatureContext = SignatureContext;
}

function cloneSignatures() {
  return SIGNATURES.map((row) => ({ ...row }));
}

export function SignatureProvider({ children }: { children: React.ReactNode }) {
  const [signatures, setSignatures] = useState<SignatureRecord[]>(cloneSignatures);

  const addSignature = useCallback((input: AddSignatureInput) => {
    const record: SignatureRecord = {
      id: String(Date.now()),
      approverName: input.approverName.trim(),
      position: input.position.trim(),
      signedCount: 0,
      isActive: true,
      imageUrl: input.imageUrl,
    };
    setSignatures((prev) => [...prev, record]);
    return record;
  }, []);

  const updateSignature = useCallback(
    (id: string, patch: Partial<Pick<SignatureRecord, "imageUrl" | "position">>) => {
      setSignatures((prev) =>
        prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
      );
    },
    []
  );

  const findByApproverName = useCallback(
    (name: string) => signatures.find((row) => row.approverName === name),
    [signatures]
  );

  const value = useMemo(
    () => ({
      signatures,
      addSignature,
      updateSignature,
      findByApproverName,
    }),
    [signatures, addSignature, updateSignature, findByApproverName]
  );

  return <SignatureContext.Provider value={value}>{children}</SignatureContext.Provider>;
}

export function useSignatures() {
  const ctx = useContext(SignatureContext);
  if (!ctx) {
    throw new Error("useSignatures must be used within SignatureProvider");
  }
  return ctx;
}
