import React from 'react';
import { ExternalLink } from 'lucide-react';

export type AccessoryType = 'toploader' | 'binder' | 'sleeve' | 'booster' | 'storage';

const FALLBACK_URLS: Record<AccessoryType, (name?: string) => string> = {
  toploader: () => 'https://www.amazon.de/s?k=pokemon+karten+toploader+hartplastik',
  binder: () => 'https://www.amazon.de/s?k=pokemon+sammelalbum+karten+binder',
  sleeve: () => 'https://www.dragonshield.com/product-category/pokemon-card-sleeves',
  booster: (name) => `https://www.amazon.de/s?k=${encodeURIComponent(`Pokemon ${name || ''} Booster`)}`,
  storage: () => 'https://www.amazon.de/s?k=pokemon+karten+aufbewahrungsbox',
};

// Populated from env vars once affiliate accounts are set up:
// NEXT_PUBLIC_TOPLOADER_AFFILIATE_URL
// NEXT_PUBLIC_BINDER_AFFILIATE_URL
// NEXT_PUBLIC_SLEEVE_AFFILIATE_URL
// NEXT_PUBLIC_STORAGE_AFFILIATE_URL
const AFFILIATE_URLS: Partial<Record<AccessoryType, string | undefined>> = {
  toploader: process.env.NEXT_PUBLIC_TOPLOADER_AFFILIATE_URL,
  binder: process.env.NEXT_PUBLIC_BINDER_AFFILIATE_URL,
  sleeve: process.env.NEXT_PUBLIC_SLEEVE_AFFILIATE_URL,
  storage: process.env.NEXT_PUBLIC_STORAGE_AFFILIATE_URL,
};

interface AccessoryLinkProps {
  type: AccessoryType;
  children: React.ReactNode;
  name?: string;
  showIcon?: boolean;
  className?: string;
}

export function AccessoryLink({ type, children, name, showIcon = false, className }: AccessoryLinkProps) {
  const href = AFFILIATE_URLS[type] || FALLBACK_URLS[type](name);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={className ?? 'inline-flex items-center gap-0.5 text-violet-600 hover:text-violet-800 underline underline-offset-2 font-medium'}
    >
      {children}
      {showIcon && <ExternalLink size={11} className="opacity-60" />}
    </a>
  );
}
