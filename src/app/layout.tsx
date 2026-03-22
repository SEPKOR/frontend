import type { Metadata } from 'next';
import { Playfair_Display, Merriweather } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const merriweather = Merriweather({ weight: ['300', '400', '700'], subsets: ['latin'], variable: '--font-merriweather' });

export const metadata: Metadata = {
  title: 'Aura Botanical | Digital Luxury Beauty',
  description: 'Premium digital skin diagnostic and consultation platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${merriweather.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
