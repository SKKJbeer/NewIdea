import { RouteSkeleton } from '@/components/RouteSkeleton';

export default function Loading() {
  return (
    <RouteSkeleton
      variant="article"
      hint="Artikel wird geladen …"
    />
  );
}
