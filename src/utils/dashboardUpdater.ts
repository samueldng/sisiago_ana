// Utilitário para disparar atualizações do dashboard
// Pode ser usado tanto no frontend quanto no backend

// Função para notificar atualização do dashboard via Server-Sent Events (futuro)
export const notifyDashboardUpdate = async () => {
  try {
    // Por enquanto, apenas log para debug
    console.log('🔄 Dashboard update triggered from server')
    
    // Futuramente, aqui podemos implementar:
    // - Server-Sent Events para notificar clientes conectados
    // - WebSocket para atualizações em tempo real
    // - Cache invalidation
    
    return true
  } catch (error) {
    console.error('❌ Erro ao notificar atualização do dashboard:', error)
    return false
  }
}

// Função para invalidar cache de estatísticas (futuro)
export const invalidateDashboardCache = async () => {
  try {
    // Por enquanto, apenas log para debug
    console.log('🗑️ Dashboard cache invalidated')
    
    // Futuramente, aqui podemos implementar:
    // - Redis cache invalidation
    // - Next.js revalidation
    // - CDN cache purge
    
    return true
  } catch (error) {
    console.error('❌ Erro ao invalidar cache do dashboard:', error)
    return false
  }
}

// Função principal para ser chamada após operações que afetam o dashboard
export const triggerDashboardUpdateServer = async () => {
  console.log('📊 Disparando atualização do dashboard do servidor...')
  
  // Executar todas as operações de atualização
  await Promise.all([
    notifyDashboardUpdate(),
    invalidateDashboardCache()
  ])
  
  console.log('✅ Atualização do dashboard processada')
}