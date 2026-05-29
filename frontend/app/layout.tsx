import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'MedGuard AI — Medicine Verification Platform',
  description:
    'Detect counterfeit medicines instantly. MedGuard AI uses OCR text extraction, LLM reasoning, and blockchain verification to classify medicine packages as Authentic, Suspicious, or Counterfeit.',
  keywords:
    'medicine verification, counterfeit drugs, AI, OCR, blockchain, healthcare, pharmaceutical, CDSCO, WHO, LLaMA',
  openGraph: {
    title: 'MedGuard AI — Medicine Verification Platform',
    description: 'Detect counterfeit medicines instantly with AI, OCR, and blockchain.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
