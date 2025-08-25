import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AmplifyProvider } from "../components/AmplifyProvider";
import { RealTimeNotificationProvider } from "../components/RealTimeNotificationProvider";
import { DataRefreshProvider } from "../contexts/DataRefreshContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bachelor Fantasy League",
  description: "Fantasy league for The Bachelor/Bachelorette",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AmplifyProvider>
          <DataRefreshProvider>
            <RealTimeNotificationProvider>
              {children}
            </RealTimeNotificationProvider>
          </DataRefreshProvider>
        </AmplifyProvider>
      </body>
    </html>
  );
}
