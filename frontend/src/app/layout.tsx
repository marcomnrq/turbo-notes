import type { Metadata } from "next";
import { Inria_Serif, Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";

// Inter is the UI/body font; Inria Serif is used for headings and note titles.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const inriaSerif = Inria_Serif({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Turbo Notes",
  description: "A clean, organized way to keep track of your notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${inriaSerif.variable} h-full antialiased`}
    >
      <body className="flex h-full w-full flex-col">
        <AuthProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
