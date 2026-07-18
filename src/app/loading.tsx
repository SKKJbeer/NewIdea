import { RouteSkeleton } from '@/components/RouteSkeleton';

// Globale Loading-Boundary: greift bei JEDER Navigation zu Routen ohne eigenes
// loading.tsx — der Nutzer bekommt sofort Feedback statt einer eingefrorenen Seite.
export default function Loading() {
  return <RouteSkeleton variant="list" />;
}
