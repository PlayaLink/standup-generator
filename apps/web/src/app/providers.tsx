'use client';

import { useEffect } from 'react';
import LogRocket from 'logrocket';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    LogRocket.init('standup-generator/standup-generator');
  }, []);

  return <>{children}</>;
}
