declare global {
  interface Window {
    storage: {
      list: (opts?: { prefix?: string; shared?: boolean }) => Promise<{ keys: string[] } | null>;
      get: (key: string, opts?: { shared?: boolean }) => Promise<{ value: string } | null>;
      set: (key: string, value: string, opts?: { shared?: boolean }) => Promise<void>;
      delete: (key: string, opts?: { shared?: boolean }) => Promise<void>;
    };
  }
}
export {};
