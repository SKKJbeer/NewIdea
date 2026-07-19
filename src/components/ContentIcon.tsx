import {
  BarChart2, TrendingUp, Lightbulb, Package, Telescope, BookOpen, RefreshCw,
  Rocket, Gem, Shield, Trophy, Coins, Search, Medal, Scale, Microscope,
  Map, Users, FolderOpen, Clock, Sparkles, CreditCard,
  type LucideIcon,
} from 'lucide-react';

// Zentrale Zuordnung: Icon-Key → Lucide-Icon.
// Content-Datenmodelle (Guides, Artikel-Meta, Guide-Topics) speichern nur den
// Key — gerendert wird IMMER ein professionelles Lucide-Icon, nie ein Emoji.
// Alte in Supabase gespeicherte Guides enthalten noch Emoji-Zeichen im Feld:
// unbekannte Werte fallen deshalb auf ein neutrales Default-Icon zurück.
const ICONS: Record<string, LucideIcon> = {
  'chart':      BarChart2,
  'trending':   TrendingUp,
  'lightbulb':  Lightbulb,
  'package':    Package,
  'telescope':  Telescope,
  'book':       BookOpen,
  'refresh':    RefreshCw,
  'rocket':     Rocket,
  'gem':        Gem,
  'shield':     Shield,
  'trophy':     Trophy,
  'coins':      Coins,
  'search':     Search,
  'medal':      Medal,
  'scale':      Scale,
  'microscope': Microscope,
  'map':        Map,
  'users':      Users,
  'folder':     FolderOpen,
  'clock':      Clock,
  'sparkles':   Sparkles,
  'card':       CreditCard,
};

interface Props {
  name?: string;
  size?: number;
  className?: string;
}

export function ContentIcon({ name, size = 20, className = '' }: Props) {
  const Icon = (name && ICONS[name]) || BookOpen;
  return <Icon size={size} className={className} aria-hidden />;
}
