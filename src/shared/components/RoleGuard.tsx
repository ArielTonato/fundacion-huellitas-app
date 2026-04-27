import { type ReactNode, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@src/shared/hooks/useAuth';
import { LoadingIndicator } from '@src/shared/components/LoadingIndicator';
import type { Role } from '@src/shared/types/models';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps): React.JSX.Element | null {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!userProfile || !allowedRoles.includes(userProfile.role))) {
      router.replace('/(auth)/login' as never);
    }
  }, [userProfile, loading, allowedRoles, router]);

  if (loading) {
    return <LoadingIndicator fullScreen />;
  }

  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    return null;
  }

  return <>{children}</>;
}
