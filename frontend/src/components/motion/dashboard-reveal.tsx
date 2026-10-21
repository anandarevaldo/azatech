'use client';

import { useLayoutEffect, type ReactNode } from 'react';
import gsap from 'gsap';

export function DashboardReveal({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) return;
      gsap.fromTo('.dashboard-heading', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .55, ease: 'power2.out' });
      gsap.fromTo('.dashboard-grid > *', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .5, stagger: .07, delay: .12, ease: 'power2.out' });
    });
    return () => context.revert();
  }, []);
  return <>{children}</>;
}
