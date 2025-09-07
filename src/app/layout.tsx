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
  title: "SenseMinds 360 - IoT Dashboard",
  description: "Advanced IoT monitoring and AI-powered analytics dashboard for environmental sensors and system health",
  manifest: "/manifest.json",
  themeColor: "#8B5CF6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SenseMinds 360",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "SenseMinds 360",
    title: "SenseMinds 360 - IoT Dashboard",
    description: "Advanced IoT monitoring and AI-powered analytics dashboard",
  },
  twitter: {
    card: "summary",
    title: "SenseMinds 360 - IoT Dashboard",
    description: "Advanced IoT monitoring and AI-powered analytics dashboard",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SenseMinds 360" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="msapplication-TileColor" content="#8B5CF6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
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
