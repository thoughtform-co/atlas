'use client';

import { ErrorState } from '@/components/chrome/ErrorState';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} label="System" />;
}
