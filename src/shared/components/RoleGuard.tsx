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
  const hasAccess = Boolean(userProfile && userProfile.activo !== false && allowedRoles.includes(userProfile.role));

  useEffect(() => {
    if (!loading && !hasAccess) {
      router.replace('/(auth)/login' as never);
    }
  }, [hasAccess, loading, router]);

  if (loading) {
    return <LoadingIndicator fullScreen />;
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
