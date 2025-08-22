'use client'

import React from 'react'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

interface AuditDashboardClientLayoutProps {
  children: React.ReactNode
}

/**
 * Layout client para o Dashboard de Auditoria
 * 
 * Este componente contém toda a lógica client-side do layout,
 * incluindo configurações de estilo, notificações e scripts.
 */
export default function AuditDashboardClientLayout({ children }: AuditDashboardClientLayoutProps) {
  return (
    <div 
      className={cn(
        inter.className,
        'min-h-screen bg-background font-sans antialiased overflow-hidden audit-dashboard'
      )}
    >
      {/* Container principal com configurações específicas para dashboard */}
      <div className="relative flex min-h-screen flex-col">
        {/* Área principal do dashboard */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      
      {/* Sistema de notificações otimizado para dashboard */}
      <Toaster 
        position="top-right"
        expand={false}
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
          className: 'audit-toast',
        }}
      />
      
      {/* Estilos específicos para o dashboard */}
      <style jsx global>{`
        /* Otimizações para dashboard */
        .audit-dashboard {
          contain: layout style paint;
          will-change: transform;
        }
        
        /* Scrollbars customizadas */
        .audit-dashboard ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .audit-dashboard ::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 4px;
        }
        
        .audit-dashboard ::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground));
          border-radius: 4px;
        }
        
        .audit-dashboard ::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--foreground));
        }
        
        /* Animações otimizadas */
        .audit-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        
        .audit-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        /* Indicadores de status */
        .status-indicator {
          position: relative;
        }
        
        .status-indicator::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        
        /* Otimizações de performance */
        .audit-metric-card {
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        /* Responsividade */
        @media (max-width: 768px) {
          .audit-dashboard {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  )
}

AuditDashboardClientLayout.displayName = 'AuditDashboardClientLayout'