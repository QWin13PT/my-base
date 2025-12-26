import { Inter } from "next/font/google";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { CurrencyProvider } from "@/lib/contexts/CurrencyContext";
import { appConfig } from "@/lib/config";
import Script from "next/script";
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
      <head>
        {/* Prevent browser extensions from modifying the DOM during SSR */}
        <Script
          id="prevent-extensions"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent browser extensions from adding attributes during hydration
              if (typeof window !== 'undefined') {
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.target.hasAttribute('cz-shortcut-listen')) {
                      mutation.target.removeAttribute('cz-shortcut-listen');
                    }
                  });
                });
                document.addEventListener('DOMContentLoaded', () => {
                  observer.observe(document.body, { attributes: true, attributeFilter: ['cz-shortcut-listen'] });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} antialiased bg-dark text-white min-h-screen`}
        suppressHydrationWarning
      >
        <WalletProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
