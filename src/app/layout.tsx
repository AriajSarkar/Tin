import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/styles/theme";
import { CurrencyProvider } from "@/hooks/useCurrency";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tin - Expense Tracker",
  description: "Local-first notebook-like expense tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
