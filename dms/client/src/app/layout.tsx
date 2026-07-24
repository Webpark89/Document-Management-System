import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@views/components/providers/AuthProvider';
import { SignatureProvider } from '@views/components/providers/SignatureProvider';
import { SidebarProvider } from '@views/components/providers/SidebarProvider';
import { ToastProvider } from '@views/components/providers/ToastProvider';

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | DMS Electronic",
    default: "DMS Electronic — Document Management & Approval System",
  },
  description:
    "ระบบจัดการเอกสารและการอนุมัติอิเล็กทรอนิกส์ (Document Management & Electronic Approval System)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${notoSans.variable} ${notoSansThai.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <SignatureProvider>
            <SidebarProvider>
              <ToastProvider>{children}</ToastProvider>
            </SidebarProvider>
          </SignatureProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
