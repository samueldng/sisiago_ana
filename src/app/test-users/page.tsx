"use client"

import React from 'react'

function TestUsersPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '16px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#111827'
          }}>Teste - Gerenciamento de Usuários</h1>
          
          <p style={{
            color: '#6b7280',
            marginBottom: '24px'
          }}>Esta é uma página de teste para verificar se o problema é específico da rota /users.</p>
          
          <div style={{
            display: 'grid',
            gap: '16px'
          }}>
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>Admin Sistema</h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>admin@sisiago.com</p>
              <span style={{ 
                fontSize: '12px', 
                color: '#059669',
                backgroundColor: '#d1fae5',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>Ativo</span>
            </div>
            
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>João Silva</h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>joao@empresa.com</p>
              <span style={{ 
                fontSize: '12px', 
                color: '#059669',
                backgroundColor: '#d1fae5',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>Ativo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestUsersPage