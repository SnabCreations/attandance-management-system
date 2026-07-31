/**
 * Developed and Crafted by Snab Creations
 * Author: @Abdulkhadhar (GitHub)
 * Copyright (c) 2026 Carmel Polytechnic College. All rights reserved.
 * 
 * This code is proprietary and may not be copied, distributed, or modified
 * without express written permission.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carmel MEAMS",
  description: "Mechanical Engineer Attendance Management System for Carmel Polytechnic College",
  icons: {
    icon: '/carmel.webp'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="page-transition-enter">
          {children}
        </div>
      </body>
    </html>
  );
}
