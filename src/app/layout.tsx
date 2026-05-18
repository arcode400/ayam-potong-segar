import type { Metadata } from "next";
import "./globals.css";
import { STORE } from "@/lib/config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: `Ayam Potong Segar ${STORE.name}`,
  description: "Ayam potong segar harian. Potong pagi, kirim di hari yang sama.",
  themeColor: "#dc1414",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
