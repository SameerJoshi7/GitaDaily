import { useState, useEffect } from 'react';
import type { Shloka } from '../components/ShlokaCard';

export function useGuidance() {
  const [guidanceQuery, setGuidanceQuery] = useState(() => sessionStorage.getItem('gitadaily_guidanceQuery') || '');
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceResult, setGuidanceResult] = useState<{
    shloka: Shloka;
    counsel: {
      modernCounsel: string;
      wellbeingInsight: string;
      actionStep: string;
    };
  } | null>(() => {
    const saved = sessionStorage.getItem('gitadaily_guidanceResult');
    return saved ? JSON.parse(saved) : null;
  });
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [guidanceRetryTimer, setGuidanceRetryTimer] = useState(0);

  useEffect(() => {
    sessionStorage.setItem('gitadaily_guidanceQuery', guidanceQuery);
  }, [guidanceQuery]);

  useEffect(() => {
    if (guidanceResult) {
      sessionStorage.setItem('gitadaily_guidanceResult', JSON.stringify(guidanceResult));
    } else {
      sessionStorage.removeItem('gitadaily_guidanceResult');
    }
  }, [guidanceResult]);

  useEffect(() => {
    let interval: number;
    if (guidanceRetryTimer > 0) {
      interval = setInterval(() => {
        setGuidanceRetryTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [guidanceRetryTimer]);

  const clearGuidance = () => {
    setGuidanceQuery('');
    setGuidanceResult(null);
    setGuidanceError(null);
    sessionStorage.removeItem('gitadaily_guidanceQuery');
    sessionStorage.removeItem('gitadaily_guidanceResult');
  };

  return {
    guidanceQuery, setGuidanceQuery,
    guidanceLoading, setGuidanceLoading,
    guidanceResult, setGuidanceResult,
    guidanceError, setGuidanceError,
    guidanceRetryTimer, setGuidanceRetryTimer,
    clearGuidance
  };
}
