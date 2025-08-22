// Sistema de permissões granulares baseado em roles

export type Role = 'admin' | 'manager' | 'operator';
export type UserRole = Role; // Alias para compatibilidade

export type Permission = 
  // Usuários
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.change_role'
  | 'users.change_status'
  | 'users.bulk_actions'
  
  // Produtos
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'products.manage_categories'
  
  // Vendas
  | 'sales.view'
  | 'sales.create'
  | 'sales.edit'
  | 'sales.delete'
  | 'sales.view_all'
  | 'sales.refund'
  
  // Relatórios
  | 'reports.view'
  | 'reports.export'
  | 'reports.financial'
  
  // Auditoria
  | 'audit.view'
  | 'audit.export'
  
  // Sistema
  | 'system.config'
  | 'system.backup'
  | 'system.maintenance';

// Mapeamento de roles para permissões
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // Todas as permissões
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'users.change_role',
    'users.change_status',
    'users.bulk_actions',
    
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'products.manage_categories',
    
    'sales.view',
    'sales.create',
    'sales.edit',
    'sales.delete',
    'sales.view_all',
    'sales.refund',
    
    'reports.view',
    'reports.export',
    'reports.financial',
    
    'audit.view',
    'audit.export',
    
    'system.config',
    'system.backup',
    'system.maintenance'
  ],
  
  manager: [
    // Usuários (limitado)
    'users.view',
    'users.edit',
    'users.change_status',
    
    // Produtos (completo)
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'products.manage_categories',
    
    // Vendas (completo)
    'sales.view',
    'sales.create',
    'sales.edit',
    'sales.delete',
    'sales.view_all',
    'sales.refund',
    
    // Relatórios (limitado)
    'reports.view',
    'reports.export'
  ],
  
  operator: [
    // Usuários (apenas visualização)
    'users.view',
    
    // Produtos (apenas visualização)
    'products.view',
    
    // Vendas (apenas suas próprias)
    'sales.view',
    'sales.create',
    'sales.edit'
  ]
};

// Função para verificar se um usuário tem uma permissão específica
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission);
}

// Função para verificar múltiplas permissões (AND)
export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Função para verificar se tem pelo menos uma permissão (OR)
export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

// Função para obter todas as permissões de um role
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Função para verificar se um role pode acessar uma rota
export function canAccessRoute(userRole: Role, route: string): boolean {
  const routePermissions: Record<string, Permission[]> = {
    '/users': ['users.view'],
    '/products': ['products.view'],
    '/sales': ['sales.view'],
    '/reports': ['reports.view'],
    '/audit-logs': ['audit.view'],
    '/settings': ['system.config']
  };
  
  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) {
    return true; // Rota pública ou não mapeada
  }
  
  return hasAnyPermission(userRole, requiredPermissions);
}

// Hook para usar permissões em componentes React
export function usePermissions(userRole: Role) {
  return {
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    canAccessRoute: (route: string) => canAccessRoute(userRole, route),
    permissions: getRolePermissions(userRole)
  };
}

// Middleware de permissões para APIs
export function requirePermission(permission: Permission) {
  return (userRole: Role): boolean => {
    return hasPermission(userRole, permission);
  };
}

// Função para validar permissões em APIs
export function validateApiPermission(userRole: string, permission: Permission): boolean {
  if (!userRole || !['admin', 'manager', 'operator'].includes(userRole)) {
    return false;
  }
  
  return hasPermission(userRole as Role, permission);
}

// Constantes para facilitar o uso
export const PERMISSIONS = {
  USERS: {
    VIEW: 'users.view' as Permission,
    CREATE: 'users.create' as Permission,
    EDIT: 'users.edit' as Permission,
    DELETE: 'users.delete' as Permission,
    CHANGE_ROLE: 'users.change_role' as Permission,
    CHANGE_STATUS: 'users.change_status' as Permission,
    BULK_ACTIONS: 'users.bulk_actions' as Permission
  },
  PRODUCTS: {
    VIEW: 'products.view' as Permission,
    CREATE: 'products.create' as Permission,
    EDIT: 'products.edit' as Permission,
    DELETE: 'products.delete' as Permission,
    MANAGE_CATEGORIES: 'products.manage_categories' as Permission
  },
  SALES: {
    VIEW: 'sales.view' as Permission,
    CREATE: 'sales.create' as Permission,
    EDIT: 'sales.edit' as Permission,
    DELETE: 'sales.delete' as Permission,
    VIEW_ALL: 'sales.view_all' as Permission,
    REFUND: 'sales.refund' as Permission
  },
  REPORTS: {
    VIEW: 'reports.view' as Permission,
    EXPORT: 'reports.export' as Permission,
    FINANCIAL: 'reports.financial' as Permission
  },
  AUDIT: {
    VIEW: 'audit.view' as Permission,
    EXPORT: 'audit.export' as Permission
  },
  SYSTEM: {
    CONFIG: 'system.config' as Permission,
    BACKUP: 'system.backup' as Permission,
    MAINTENANCE: 'system.maintenance' as Permission
  }
} as const;