import { Inter } from "next/font/google";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { appConfig } from "@/lib/config";
import Header from "@/components/shared/Header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: appConfig.name,
  description: appConfig.tagline,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-dark text-white min-h-screen`}
      >
        <WalletProvider>
          <Header />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
