import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * „Passwort-Wiederherstellung läuft"-Flag.
 *
 * Nach dem Recovery-Code hat man zwar schon eine Session, darf aber erst in die
 * App, wenn ein neues Passwort gesetzt ist. Das Flag hebt in RootNavigator den
 * Reset-Screen über alle anderen Gates (siehe `_layout.tsx`).
 *
 * BEWUSST nur im Speicher (kein AsyncStorage): ein App-Neustart mitten im Reset
 * soll NICHT dauerhaft aussperren — dann landet man einfach normal in der App
 * (das alte Passwort gilt weiter) und kann den Reset erneut anstoßen. Gespiegelt
 * über TanStack Query nach demselben Muster wie useAuth/useActiveCity: ein
 * Setter, alle Verbraucher re-rendern.
 */
const RECOVERY_KEY = ['auth', 'recoveryPending'] as const;

export function useRecovery() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: RECOVERY_KEY,
    queryFn: () => false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const setRecoveryPending = useCallback(
    (value: boolean) => {
      queryClient.setQueryData(RECOVERY_KEY, value);
    },
    [queryClient],
  );

  return { recoveryPending: query.data ?? false, setRecoveryPending };
}
