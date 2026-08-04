import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { reportClientError } from '../monitoring/reportError';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => reportClientError(error, { source: 'react-query.query' }),
  }),
  mutationCache: new MutationCache({
    onError: (error) => reportClientError(error, { source: 'react-query.mutation' }),
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
});
