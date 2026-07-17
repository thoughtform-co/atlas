'use client';

import { ErrorState } from '@/components/chrome/ErrorState';

export default function ForgeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} label="Forge" />;
}
