import type { ReactNode } from 'react';
import { IBM_Plex_Mono, Instrument_Sans } from 'next/font/google';

import './globals.css';

import { Providers } from './providers.js';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-ui',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export const metadata = {
  title: 'PolicyVault',
  description: 'Bounded ERC-20 spending for services and AI agents',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${ibmPlexMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
