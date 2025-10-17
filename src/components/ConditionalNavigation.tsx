'use client';

import { usePathname } from 'next/navigation';
import Navigation from './nav';

export default function ConditionalNavigation() {
  const pathname = usePathname();
  
  // Hide navigation on home page and sign-in page
  if (pathname === '/' || pathname === '/sign-in') {
    return null;
  }
  
  return <Navigation />;
}
