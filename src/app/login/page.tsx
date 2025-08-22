'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import runAuthDiagnostic from '@/utils/authDiagnostic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn, Download, X, Loader2 } from 'lucide-react';

// Schema de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

type LoginForm = z.infer<typeof loginSchema>;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Garantir que o componente está montado no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirecionar se já estiver autenticado (apenas no cliente)
  useEffect(() => {
    if (isMounted && !authLoading && isAuthenticated) {
      console.log('✅ LoginPage: Usuário já autenticado, redirecionando para /');
      router.replace('/');
    }
  }, [isAuthenticated, authLoading, router, isMounted]);

  // Detectar se pode instalar como PWA (apenas no cliente)
  useEffect(() => {
    if (!isMounted) return;
    
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, [isMounted]);

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Limpar erro da API
    if (apiError) {
      setApiError('');
    }
  };

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<LoginForm> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof LoginForm] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const installPWA = async () => {
    if (deferredPrompt) {
      console.log('📱 PWA: Iniciando instalação');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`📱 PWA: Resultado da instalação: ${outcome}`);
      setDeferredPrompt(null);
    }
    setShowPWAPrompt(false);
    console.log('🔄 LoginPage: Redirecionando para /');
    router.replace('/');
  };

  const skipPWA = () => {
    console.log('⏭️ PWA: Instalação ignorada');
    setShowPWAPrompt(false);
    console.log('🔄 LoginPage: Redirecionando para /');
    router.replace('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      console.log('🔐 LoginPage: Tentando fazer login com:', formData.email);
      const success = await login(formData.email, formData.password);

      if (success) {
        console.log('✅ LoginPage: Login bem-sucedido');
        // Mostrar sugestão de PWA se disponível
        if (deferredPrompt) {
          setShowPWAPrompt(true);
        } else {
          console.log('🔄 LoginPage: Redirecionando para /');
          router.replace('/');
        }
      } else {
        console.log('❌ LoginPage: Login falhou - credenciais inválidas');
        setApiError('Email ou senha incorretos. Verifique suas credenciais.');
      }
    } catch (error) {
      console.error('❌ LoginPage: Erro no login:', error);
      setApiError('Erro de conexão com o servidor. Por favor, tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar loading enquanto verifica autenticação ou não está montado
  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">{!isMounted ? 'Carregando...' : 'Verificando autenticação...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-full p-4 shadow-lg">
              <img 
                src="/logo.svg" 
                alt="SISIAGO" 
                className="h-12 w-auto sm:h-16"
                onError={(e) => {
                  if (isMounted) {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'h-12 w-12 sm:h-16 sm:w-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl';
                    fallback.textContent = 'S';
                    target.parentNode?.appendChild(fallback);
                  }
                }}
                onLoad={() => console.log('Logo carregada com sucesso')}
              />
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-2">Sistema de Gestão Comercial</p>
        </div>

        <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center flex items-center justify-center gap-2 text-gray-900">
              <LogIn className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              Entrar
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {apiError && (
                <Alert variant="destructive">
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`h-11 ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} transition-colors`}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`h-11 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} transition-colors`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </div>
                )}
              </Button>
              
              {/* Botão de diagnóstico - visível apenas em produção */}
              {process.env.NODE_ENV === 'production' && (
                <div className="mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full text-xs" 
                    onClick={() => runAuthDiagnostic()}
                  >
                    Diagnosticar Problemas de Login
                  </Button>
                </div>
              )}
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Não tem uma conta? Entre em contato com o administrador.</p>
            </div>
          </CardContent>
        </Card>

        {/* Modal de sugestão de PWA */}
        {showPWAPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm mx-auto shadow-2xl border-0 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-3">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Download className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Instalar SISIAGO
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Instale o app em seu dispositivo para uma experiência melhor e acesso offline.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <Button
                    onClick={installPWA}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Instalar App
                  </Button>
                  <Button
                    onClick={skipPWA}
                    variant="outline"
                    className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Continuar no navegador
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}