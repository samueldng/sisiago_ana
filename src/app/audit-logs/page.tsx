'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Eye, Filter, X, Download, Calendar, FileText, FileJson, BarChart3, ChevronDown, ChevronRight, Diff, Clock, User, Database, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: any;
  new_values: any;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface AuditStats {
  totalLogs: number;
  byOperation: Record<string, number>;
  byTable: Record<string, number>;
  byUser: Record<string, number>;
  recentActivity: AuditLog[];
}

// Funções auxiliares
const getOperationLabel = (operation: string) => {
  const labels = {
    INSERT: 'Criação',
    UPDATE: 'Atualização',
    DELETE: 'Exclusão'
  };
  return labels[operation as keyof typeof labels] || operation;
};

const getOperationColor = (operation: string) => {
  const colors = {
    INSERT: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800'
  };
  return colors[operation as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getTableLabel = (tableName: string) => {
  const labels = {
    users: 'Usuários',
    products: 'Produtos',
    categories: 'Categorias',
    sales: 'Vendas',
    clients: 'Clientes',
    customers: 'Clientes',
    payments: 'Pagamentos'
  };
  return labels[tableName as keyof typeof labels] || tableName;
};

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 25,
    offset: 0,
    hasMore: false
  });
  const [filters, setFilters] = useState({
    table: '',
    operation: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const loadLogs = async (offset = 0, append = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        offset: offset.toString(),
        limit: pagination.limit.toString(),
        ...(filters.table && { table_name: filters.table }),
        ...(filters.operation && { operation: filters.operation }),
        ...(filters.userId && { user_id: filters.userId }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate })
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar logs');

      const data = await response.json();
      
      if (append) {
        setLogs(prev => [...prev, ...data.logs]);
      } else {
        setLogs(data.logs);
      }
      
      setPagination({
        total: data.pagination.total,
        limit: data.pagination.limit,
        offset: data.pagination.offset,
        hasMore: data.pagination.hasMore
      });
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params = new URLSearchParams({
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate })
      });

      const response = await fetch(`/api/audit-logs/stats?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar estatísticas');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  const exportLogs = async (format: 'csv' | 'json') => {
    try {
      setExporting(true);
      const params = new URLSearchParams({
        export_format: format,
        ...(filters.table && { table_name: filters.table }),
        ...(filters.operation && { operation: filters.operation }),
        ...(filters.userId && { user_id: filters.userId }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate })
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      if (!response.ok) throw new Error('Erro ao exportar logs');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Logs exportados em ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      toast.error('Erro ao exportar logs');
    } finally {
      setExporting(false);
    }
  };

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      const nextOffset = pagination.offset + pagination.limit;
      loadLogs(nextOffset, true);
    }
  };

  const handleFilter = () => {
    loadLogs(0, false);
  };

  const clearFilters = () => {
    setFilters({
      table: '',
      operation: '',
      userId: '',
      startDate: '',
      endDate: ''
    });
    loadLogs(0, false);
  };

  const handleStatsToggle = () => {
    if (!showStats) {
      loadStats();
    }
    setShowStats(!showStats);
  };

  const formatJson = (obj: any) => {
    if (!obj) return 'N/A';
    return JSON.stringify(obj, null, 2);
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getChangedFields = (oldValues: any, newValues: any) => {
    if (!oldValues || !newValues) return [];
    
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
    
    allKeys.forEach(key => {
      const oldVal = oldValues[key];
      const newVal = newValues[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({ field: key, oldValue: oldVal, newValue: newVal });
      }
    });
    
    return changes;
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  useEffect(() => {
    loadLogs(0, false);
  }, []);

  if (loading && logs.length === 0) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando logs de auditoria...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Logs de Auditoria</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-sm text-gray-600">
              {pagination.total} registros encontrados
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  onClick={() => setViewMode('table')}
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8"
                >
                  Tabela
                </Button>
                <Button
                  onClick={() => setViewMode('cards')}
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8"
                >
                  Cards
                </Button>
              </div>
              <Button
                onClick={handleStatsToggle}
                variant="outline"
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showStats ? 'Ocultar' : 'Ver'} Estatísticas
              </Button>
              <Button
                onClick={() => exportLogs('csv')}
                variant="outline"
                size="sm"
                disabled={exporting}
              >
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                onClick={() => exportLogs('json')}
                variant="outline"
                size="sm"
                disabled={exporting}
              >
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {showStats && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLogs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Operação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(stats.byOperation).map(([op, count]) => (
                    <div key={op} className="flex justify-between text-sm">
                      <span>{getOperationLabel(op)}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Tabela</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(stats.byTable).slice(0, 5).map(([table, count]) => (
                    <div key={table} className="flex justify-between text-sm">
                      <span>{getTableLabel(table)}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Usuário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(stats.byUser).slice(0, 5).map(([user, count]) => (
                    <div key={user} className="flex justify-between text-sm">
                      <span className="truncate">{user}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tabela</label>
                <Select
                  value={filters.table}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, table: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as tabelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as tabelas</SelectItem>
                    <SelectItem value="users">Usuários</SelectItem>
                    <SelectItem value="products">Produtos</SelectItem>
                    <SelectItem value="sales">Vendas</SelectItem>
                    <SelectItem value="customers">Clientes</SelectItem>
                    <SelectItem value="categories">Categorias</SelectItem>
                    <SelectItem value="payments">Pagamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Operação</label>
                <Select
                  value={filters.operation}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, operation: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as operações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as operações</SelectItem>
                    <SelectItem value="INSERT">Criação</SelectItem>
                    <SelectItem value="UPDATE">Atualização</SelectItem>
                    <SelectItem value="DELETE">Exclusão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Usuário ID</label>
                <Input
                  placeholder="ID do usuário"
                  value={filters.userId}
                  onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data Início</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data Fim</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleFilter} className="flex-1">
                  Filtrar
                </Button>
                <Button onClick={clearFilters} variant="outline">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs de auditoria */}
        {viewMode === 'table' ? (
          /* Visualização em Tabela */
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tabela
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Operação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{log.user_name || 'Sistema'}</div>
                          <div className="text-sm text-gray-500">{log.user_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getTableLabel(log.table_name)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getOperationColor(log.operation)}>
                            {getOperationLabel(log.operation)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.record_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ip_address || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
                              </DialogHeader>
                              {selectedLog && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">ID</label>
                                      <p className="text-sm text-gray-900">{selectedLog.id}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">Data/Hora</label>
                                      <p className="text-sm text-gray-900">
                                        {format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">Usuário</label>
                                      <p className="text-sm text-gray-900">{selectedLog.user_name || 'Sistema'}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">Email</label>
                                      <p className="text-sm text-gray-900">{selectedLog.user_email || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">Tabela</label>
                                      <p className="text-sm text-gray-900">{getTableLabel(selectedLog.table_name)}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">Operação</label>
                                      <Badge className={getOperationColor(selectedLog.operation)}>
                                        {getOperationLabel(selectedLog.operation)}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">ID do Registro</label>
                                      <p className="text-sm text-gray-900">{selectedLog.record_id}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">IP</label>
                                      <p className="text-sm text-gray-900">{selectedLog.ip_address || 'N/A'}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">User Agent</label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                      {selectedLog.user_agent || 'N/A'}
                                    </p>
                                  </div>
                                  
                                  {selectedLog.old_values && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Valores Antigos</label>
                                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                                        {formatJson(selectedLog.old_values)}
                                      </pre>
                                    </div>
                                  )}
                                  
                                  {selectedLog.new_values && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Valores Novos</label>
                                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                                        {formatJson(selectedLog.new_values)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {logs.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhum log encontrado</p>
                </div>
              )}
              
              {pagination.hasMore && (
                <div className="p-4 text-center border-t">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? 'Carregando...' : 'Carregar Mais'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Visualização em Cards */
          <div className="space-y-4">
            {logs.map((log) => {
              const isExpanded = expandedLogs.has(log.id);
              const changedFields = getChangedFields(log.old_values, log.new_values);
              
              return (
                <Card key={log.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <div 
                          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => toggleLogExpansion(log.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                                <Badge className={getOperationColor(log.operation)}>
                                  {getOperationLabel(log.operation)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Database className="h-4 w-4" />
                                <span>{getTableLabel(log.table_name)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                <span>{log.user_name || 'Sistema'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
                              </div>
                              {changedFields.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Diff className="h-4 w-4" />
                                  <span>{changedFields.length} alterações</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t bg-gray-50 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                ID do Log
                              </label>
                              <p className="text-sm text-gray-900 font-mono">{log.id}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                ID do Registro
                              </label>
                              <p className="text-sm text-gray-900 font-mono">{log.record_id}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                IP Address
                              </label>
                              <p className="text-sm text-gray-900">{log.ip_address || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Email do Usuário
                              </label>
                              <p className="text-sm text-gray-900">{log.user_email || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Role do Usuário
                              </label>
                              <p className="text-sm text-gray-900">{log.user_role || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Data/Hora Completa
                              </label>
                              <p className="text-sm text-gray-900">
                                {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          
                          {log.user_agent && (
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                User Agent
                              </label>
                              <p className="text-xs text-gray-700 bg-white p-2 rounded border break-all">
                                {log.user_agent}
                              </p>
                            </div>
                          )}
                          
                          {/* Alterações detalhadas para operações UPDATE */}
                          {log.operation === 'UPDATE' && changedFields.length > 0 && (
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                <Diff className="h-4 w-4 inline mr-1" />
                                Campos Alterados ({changedFields.length})
                              </label>
                              <div className="space-y-3">
                                {changedFields.map((change, index) => (
                                  <div key={index} className="bg-white rounded border p-3">
                                    <div className="font-medium text-sm text-gray-900 mb-2">
                                      {change.field}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <div className="text-xs text-red-600 font-medium mb-1">Valor Anterior</div>
                                        <div className="text-sm bg-red-50 border border-red-200 rounded p-2">
                                          <code className="text-red-800">{formatValue(change.oldValue)}</code>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-green-600 font-medium mb-1">Valor Novo</div>
                                        <div className="text-sm bg-green-50 border border-green-200 rounded p-2">
                                          <code className="text-green-800">{formatValue(change.newValue)}</code>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Dados completos para operações INSERT */}
                          {log.operation === 'INSERT' && log.new_values && (
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                <Activity className="h-4 w-4 inline mr-1" />
                                Dados Criados
                              </label>
                              <div className="bg-white rounded border p-3">
                                <pre className="text-xs text-gray-700 overflow-x-auto">
                                  {formatJson(log.new_values)}
                                </pre>
                              </div>
                            </div>
                          )}
                          
                          {/* Dados removidos para operações DELETE */}
                          {log.operation === 'DELETE' && log.old_values && (
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                <Activity className="h-4 w-4 inline mr-1" />
                                Dados Removidos
                              </label>
                              <div className="bg-white rounded border p-3">
                                <pre className="text-xs text-gray-700 overflow-x-auto">
                                  {formatJson(log.old_values)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              );
            })}
            
            {logs.length === 0 && !loading && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">Nenhum log encontrado</p>
                </CardContent>
              </Card>
            )}
            
            {pagination.hasMore && (
              <div className="text-center">
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Carregando...' : 'Carregar Mais'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
