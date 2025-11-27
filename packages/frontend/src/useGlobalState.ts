import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { QUERY_KEYS } from './constants/queryKeys.ts';

export function useGlobalStringState(queryKey: string, defaultValue: string): [string, (newValue: string) => void] {
  const queryClient = useQueryClient();

  // seed from cache if present, else from default
  const cached = queryClient.getQueryData<string>([queryKey]);
  const [local, setLocal] = useState<string>(cached ?? defaultValue);

  useEffect(() => {
    setValue(local);
  }, [local]);

  const setValue = (newValue: string) => {
    setLocal(newValue);
    queryClient.setQueryData([queryKey], newValue);
  };
  return [local, setValue];
}

type UseGlobalStateReturn<T> = [T, (newValue: T) => void];

export function useGlobalState<T>(
  queryKey: (typeof QUERY_KEYS)[keyof typeof QUERY_KEYS],
  defaultValue: T,
): UseGlobalStateReturn<T> {
  const queryClient = useQueryClient();

  const { data = defaultValue } = useQuery<T>({
    queryKey: [queryKey],
    staleTime: Number.POSITIVE_INFINITY,
    enabled: false,
    initialData: defaultValue,
    queryFn: async () => defaultValue,
  });

  const { mutate } = useMutation<T, unknown, T>({
    mutationFn: async (newValue) => newValue,
    onMutate: (newValue) => {
      queryClient.setQueryData([queryKey], newValue);
    },
  });

  return [data, mutate];
}
