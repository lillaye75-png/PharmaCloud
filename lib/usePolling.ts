"use client";

import { useEffect, useRef } from "react";

export function usePolling(callback: () => void, intervalMs: number, deps: unknown[] = []) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    savedCallback.current();
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);
}
