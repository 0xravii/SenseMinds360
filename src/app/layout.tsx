import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "SenseMinds 360 - Public Safety Web Application",
  description: "A comprehensive public safety web application for monitoring, analysis, and incident management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${roboto_mono.variable} antialiased`}>
        <ErrorBoundary>
          <TooltipProvider>
            <AppShell>{children}</AppShell>
          </TooltipProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
