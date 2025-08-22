'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Aguardar o carregamento inicial
    if (isLoading) return;
    
    console.log('🛡️ ProtectedRoute: Verificando acesso - isAuthenticated:', isAuthenticated, 'user:', user?.email);
    
    if (!isAuthenticated) {
      console.log('🛡️ ProtectedRoute: Usuário não autenticado, redirecionando para /login');
      router.replace('/login');
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      console.log('🛡️ ProtectedRoute: Usuário sem permissão, redirecionando para /unauthorized');
      router.replace('/unauthorized');
      return;
    }
    
    console.log('✅ ProtectedRoute: Acesso autorizado');
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    console.log('🛡️ ProtectedRoute: Carregando autenticação...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderizar nada (será redirecionado)
  if (!isAuthenticated) {
    console.log('🛡️ ProtectedRoute: Não autenticado, aguardando redirecionamento...');
    return null;
  }

  // Se não tiver a role necessária, não renderizar nada (será redirecionado)
  if (requiredRole && user?.role !== requiredRole) {
    console.log('🛡️ ProtectedRoute: Sem permissão, aguardando redirecionamento...');
    return null;
  }

  // Renderizar o conteúdo protegido
  console.log('✅ ProtectedRoute: Renderizando conteúdo protegido');
  return <>{children}</>;
}
