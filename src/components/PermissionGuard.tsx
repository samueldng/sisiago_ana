'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Permission, Role, hasPermission } from '@/lib/permissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  role?: Role;
}

/**
 * Componente para controle de acesso baseado em permissões
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  role
}: PermissionGuardProps) {
  const { user } = useAuth();
  
  // Se não há usuário logado, não renderiza nada
  if (!user) {
    return <>{fallback}</>;
  }
  
  const userRole = user.role as Role;
  
  // Verificar role específico se fornecido
  if (role && userRole !== role) {
    return <>{fallback}</>;
  }
  
  // Verificar permissão única
  if (permission && !hasPermission(userRole, permission)) {
    return <>{fallback}</>;
  }
  
  // Verificar múltiplas permissões
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      // Requer todas as permissões
      const hasAllPermissions = permissions.every(p => hasPermission(userRole, p));
      if (!hasAllPermissions) {
        return <>{fallback}</>;
      }
    } else {
      // Requer pelo menos uma permissão
      const hasAnyPermission = permissions.some(p => hasPermission(userRole, p));
      if (!hasAnyPermission) {
        return <>{fallback}</>;
      }
    }
  }
  
  return <>{children}</>;
}

/**
 * Hook para verificar permissões em componentes
 */
export function usePermissions() {
  const { user } = useAuth();
  
  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role as Role, permission);
  };
  
  const checkRole = (role: Role): boolean => {
    if (!user) return false;
    return user.role === role;
  };
  
  return {
    checkPermission,
    checkRole,
    user
  };
}
