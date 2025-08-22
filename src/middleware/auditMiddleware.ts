import { NextRequest } from 'next/server';
import { createAuditLog } from '@/lib/supabase';

/**
 * Extrai informações da requisição para auditoria
 */
export function extractRequestInfo(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   request.ip || 
                   'Unknown';
  
  return { userAgent, ipAddress };
}

/**
 * Registra uma ação de auditoria
 */
export async function logAuditAction({
  tableName,
  recordId,
  operation,
  oldValues,
  newValues,
  userId,
  request
}: {
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  oldValues?: any;
  newValues?: any;
  userId: string;
  request?: NextRequest;
}) {
  try {
    const { userAgent, ipAddress } = request ? 
      extractRequestInfo(request) : 
      { userAgent: 'System', ipAddress: 'System' };

    await createAuditLog({
      tableName,
      recordId,
      operation,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      userId,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
    // Não propagar o erro para não afetar a operação principal
  }
}

/**
 * Funções auxiliares para diferentes tipos de operação
 */
export const auditLogger = {
  logInsert: (tableName: string, recordId: string, newValues: any, userId: string, request?: NextRequest) => 
    logAuditAction({ tableName, recordId, operation: 'INSERT', newValues, userId, request }),
    
  logUpdate: (tableName: string, recordId: string, oldValues: any, newValues: any, userId: string, request?: NextRequest) => 
    logAuditAction({ tableName, recordId, operation: 'UPDATE', oldValues, newValues, userId, request }),
    
  logDelete: (tableName: string, recordId: string, oldValues: any, userId: string, request?: NextRequest) => 
    logAuditAction({ tableName, recordId, operation: 'DELETE', oldValues, userId, request })
};