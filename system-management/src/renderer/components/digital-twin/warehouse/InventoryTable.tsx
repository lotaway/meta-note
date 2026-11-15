import React, { useState, useMemo } from 'react'

export interface InventoryItem {
  id: string
  sku: string
  name: string
  category: string
  quantity: number
  unit: string
  location: string
  shelfId: string
  batchNo?: string
  productionDate?: string
  expiryDate?: string
  minStock: number
  maxStock: number
  status: 'normal' | 'low' | 'critical' | 'overstock' | 'expired'
  lastUpdated: string
}

export interface InventoryTableProps {
  items: InventoryItem[]
  onRowClick?: (item: InventoryItem) => void
  selectedId?: string
  searchable?: boolean
  pageSize?: number
}

export function InventoryTable({ 
  items, 
  onRowClick, 
  selectedId,
  searchable = true,
  pageSize = 10
}: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<keyof InventoryItem>('lastUpdated')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredItems = useMemo(() => {
    let result = [...items]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(item => 
        item.sku.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term)
      )
    }
    
    result.sort((a, b) => {
      const aVal = String(a[sortField] ?? '')
      const bVal = String(b[sortField] ?? '')
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    return result
  }, [items, searchTerm, sortField, sortOrder])

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, currentPage, pageSize])

  const totalPages = Math.ceil(filteredItems.length / pageSize)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e' }
      case 'low': return { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' }
      case 'critical': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' }
      case 'overstock': return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' }
      case 'expired': return { bg: 'rgba(168, 85, 247, 0.2)', text: '#a855f7' }
      default: return { bg: 'rgba(100, 116, 139, 0.2)', text: '#64748b' }
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal': return '正常'
      case 'low': return '偏低'
      case 'critical': return '紧急'
      case 'overstock': return '超储'
      case 'expired': return '过期'
      default: return status
    }
  }

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ field }: { field: keyof InventoryItem }) => {
    if (sortField !== field) return null
    return <span style={{ marginLeft: '4px' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.9)',
      borderRadius: '12px',
      border: '1px solid #334155',
      color: '#f1f5f9',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      {searchable && (
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <input
            type="text"
            placeholder="搜索 SKU/名称/类别/位置..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#f1f5f9',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <span style={{ color: '#64748b', fontSize: '12px' }}>
            {filteredItems.length} 条记录
          </span>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '13px'
        }}>
          <thead>
            <tr style={{ background: 'rgba(30, 41, 59, 0.8)' }}>
              {[
                { key: 'sku', label: 'SKU' },
                { key: 'name', label: '名称' },
                { key: 'category', label: '类别' },
                { key: 'quantity', label: '数量' },
                { key: 'location', label: '位置' },
                { key: 'status', label: '状态' },
                { key: 'lastUpdated', label: '更新时间' }
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key as keyof InventoryItem)}
                  style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: '1px solid #334155',
                    color: '#94a3b8',
                    fontWeight: 500,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {col.label}
                  <SortIcon field={col.key as keyof InventoryItem} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map(item => {
              const statusStyle = getStatusColor(item.status)
              return (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  style={{
                    cursor: 'pointer',
                    background: selectedId === item.id ? 'rgba(56, 189, 248, 0.1)' : 
                               'transparent',
                    borderBottom: '1px solid #1e293b',
                    transition: 'background 0.2s'
                  }}
                >
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: '#38bdf8' }}>
                    {item.sku}
                  </td>
                  <td style={{ padding: '10px 8px' }}>{item.name}</td>
                  <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{item.category}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ 
                      color: item.quantity <= item.minStock ? '#ef4444' : 
                             item.quantity >= item.maxStock ? '#3b82f6' : '#f1f5f9',
                      fontWeight: 500
                    }}>
                      {item.quantity} {item.unit}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{item.location}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 500,
                      background: statusStyle.bg,
                      color: statusStyle.text
                    }}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', color: '#64748b', fontSize: '12px' }}>
                    {new Date(item.lastUpdated).toLocaleString('zh-CN')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #334155',
              background: currentPage === 1 ? '#1e293b' : '#334155',
              color: currentPage === 1 ? '#64748b' : '#f1f5f9',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            上一页
          </button>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>
            第 {currentPage} / {totalPages} 页
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #334155',
              background: currentPage === totalPages ? '#1e293b' : '#334155',
              color: currentPage === totalPages ? '#64748b' : '#f1f5f9',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}