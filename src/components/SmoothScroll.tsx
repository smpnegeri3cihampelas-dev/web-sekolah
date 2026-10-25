'use client';

import { ReactLenis } from 'lenis/react';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Disable Lenis smooth scroll on complex web apps to ensure 100% native scrolling speed & no wheel trapping
  const isApp = pathname?.startsWith('/elearning') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/login');

  if (isApp) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}

