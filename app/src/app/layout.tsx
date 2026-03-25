import type { ReactNode } from 'react';

import './globals.css';

import { Providers } from './providers';

export const metadata = {
  title: 'PolicyVault',
  description: 'Bounded ERC-20 spending for services and AI agents',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
