'use client';

import { useState, useEffect } from 'react';
import { formatDateTime } from '@/utils';

export default function ClientTime() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time
    setCurrentTime(new Date());
    
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!currentTime) {
    return <span>--:--</span>;
  }

  return <span>{formatDateTime(currentTime)}</span>;
}