import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export function useGlobalState<T>(queryKey: string, defaultValue: T): [T, (newValue: T) => void] {
  const queryClient = useQueryClient();

  // seed from cache if present, else from default
  const cached = queryClient.getQueryData<T>([queryKey]);
  const [local, setLocal] = useState<T>(cached ?? defaultValue);

  useEffect(() => {
    setValue(local);
  }, [local]);

  const setValue = (newValue: T) => {
    setLocal(newValue);
    queryClient.setQueryData([queryKey], newValue);
  };

  return [local, setValue];
}
