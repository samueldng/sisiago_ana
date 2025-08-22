import React from 'react'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import AuditDashboardClientLayout from './client-layout'

/**
 * Metadados da página para Next.js
 */
export const metadata: Metadata = {
  title: 'Dashboard de Auditoria - SisIAGO',
  description: 'Dashboard avançado de auditoria e monitoramento de segurança do sistema SisIAGO',
  keywords: 'auditoria, segurança, logs, monitoramento, dashboard, SisIAGO'
}

interface AuditDashboardLayoutProps {
  children: React.ReactNode
}

/**
 * Layout específico para o Dashboard de Auditoria
 * 
 * Este layout fornece uma estrutura otimizada para o dashboard de auditoria,
 * incluindo configurações específicas de estilo, notificações e contexto.
 */
export default function AuditDashboardLayout({ children }: AuditDashboardLayoutProps) {
  return (
    <AuditDashboardClientLayout>
      {children}
    </AuditDashboardClientLayout>
  )
}

/**
 * Configurações do layout
 */
AuditDashboardLayout.displayName = 'AuditDashboardLayout'