import { useState, useEffect } from "react";

export function useStoreAsync<T>(
  subscribe: (listener: () => void) => () => void,
  getSnapshot: () => Promise<T>,
  initialValue: T
): T {
  const [data, setData] = useState<T>(initialValue);

  useEffect(() => {
    let isMounted = true;
    const fetch = () => {
      getSnapshot().then((res) => {
        if (isMounted) setData(res);
      });
    };

    fetch(); // Initial fetch
    const unsubscribe = subscribe(fetch);
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [subscribe, getSnapshot]);

  return data;
}
