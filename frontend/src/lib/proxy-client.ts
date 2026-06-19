export async function dbExecute<T = any>(payload: any): Promise<{ result: T, total?: number, success: boolean, message?: string }> {
  if (import.meta.env.DEV) {
    const { mockDbExecute } = await import('./mock-data')
    return mockDbExecute<T>(payload)
  }
  try {
    const { data, ...metadata } = payload
    const token = localStorage.getItem('auth_token')
    const baseURL = import.meta.env.VITE_API_URL || ''
    
    const response = await fetch(`${baseURL}/db/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-db-meta': JSON.stringify(metadata),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ data: data ?? {} })
    })
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/'
      throw new Error('Unauthorized')
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      const detail = body?.detail ?? body?.error ?? `Erro do servidor (${response.status})`
      throw new Error(detail)
    }
    
    return await response.json()
  } catch (error) {
    console.error('dbExecute error:', error)
    throw error
  }
}

/**
 * Converte um File para um objeto com metadata + data em base64.
 * O backend converte base64 → Binary(BSON) automaticamente via convert_files_to_binary().
 */
export async function fileToBase64(file: File): Promise<{ name: string; type: string; size: number; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] // Remove "data:...;base64,"
      resolve({ name: file.name, type: file.type, size: file.size, data: base64 })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Faz download de um arquivo diretamente como stream (sem carregar base64 em memória).
 */
export async function downloadFileFromDb(
  collection: string,
  docId: string,
  fileIndex: number, // mantido para retrocompatibilidade da URL da api, mas sempre 0
  fileName: string,
  eventId?: string
): Promise<void> {
  const token = localStorage.getItem('auth_token')
  const baseURL = import.meta.env.VITE_API_URL || ''
  
  let url = `${baseURL}/db/file/${collection}/${docId}/0`
  if (eventId) url += `?event_id=${eventId}`
  
  const response = await fetch(url, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  })
  
  if (response.status === 401) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.location.href = '/'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`)
  }
  
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(blobUrl)  // Libera memória imediatamente
}

/**
 * Busca o histórico completo de eventos de uma entidade via Event Store.
 */
export async function fetchEntityEvents<T = any>(
  streamType: string,
  streamId: string
): Promise<{ result: T[], total: number, success: boolean }> {
  const token = localStorage.getItem('auth_token')
  const baseURL = import.meta.env.VITE_API_URL || ''
  
  const response = await fetch(`${baseURL}/db/events/${streamType}/${streamId}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  })

  if (response.status === 401) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.location.href = '/'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`)
  }

  return await response.json()
}

/**
 * Retorna pacientes inativados (soft-deleted) com motivo e responsável.
 */
export async function fetchDeletedPatients(): Promise<{
  result: any[]
  total: number
  success: boolean
}> {
  if (import.meta.env.DEV) {
    const { getDeletedPatients } = await import('./mock-data')
    const deleted = getDeletedPatients()
    return { result: deleted, total: deleted.length, success: true }
  }
  const token = localStorage.getItem('auth_token')
  const baseURL = import.meta.env.VITE_API_URL || ''
  const response = await fetch(`${baseURL}/db/patients/deleted`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

/**
 * Calcula a taxa de internação hospitalar no backend.
 */
export async function fetchHospitalizationRate(start?: string, end?: string): Promise<{
  result: { hospitalizationEvents: number; adIdPatients: number; rate: number | null; period: any }
  success: boolean
}> {
  if (import.meta.env.DEV) {
    // Calcula localmente com os mesmos dados do mock
    const { PATIENTS: mockPatients } = await import('./mock-data')
    const startD = start ? new Date(start + 'T00:00:00') : null
    const endD = end ? new Date(end + 'T23:59:59') : null
    let hosp = 0
    const adIdIds = new Set<string>()
    for (const p of mockPatients) {
      for (const e of p.events ?? []) {
        const d = new Date(e.occurrenceDate)
        if (startD && d < startD) continue
        if (endD && d > endD) continue
        if ((e.indicator?.name ?? '').startsWith('03')) hosp++
      }
      const ind06 = (p.events ?? []).filter((e: any) => (e.indicator?.name ?? '').startsWith('06'))
      const filtered06 = ind06.filter((e: any) => {
        const d = new Date(e.occurrenceDate)
        return (!startD || d >= startD) && (!endD || d <= endD)
      })
      if (filtered06.length) {
        const last = filtered06.sort((a: any, b: any) => a.occurrenceDate < b.occurrenceDate ? 1 : -1)[0]
        const sub: string = last.subindicator?.name ?? ''
        if (sub.includes('AD') || sub.includes('ID')) adIdIds.add(p._id)
      }
    }
    const total = adIdIds.size
    return {
      success: true,
      result: {
        hospitalizationEvents: hosp,
        adIdPatients: total,
        rate: total > 0 ? parseFloat(((hosp / total) * 100).toFixed(2)) : null,
        period: { start: start ?? null, end: end ?? null },
      },
    }
  }
  const token = localStorage.getItem('auth_token')
  const baseURL = import.meta.env.VITE_API_URL || ''
  const params = new URLSearchParams()
  if (start) params.set('start', start)
  if (end) params.set('end', end)
  const response = await fetch(`${baseURL}/analytics/hospitalization-rate?${params}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

/**
 * Busca logs do event store com filtros (para a view de auditoria).
 * Usa o endpoint genérico find sobre a collection events_store.
 */
export async function fetchEventStoreLogs<T = any>(options: {
  query?: Record<string, any>
  skip?: number
  limit?: number
  sort?: [string, 1 | -1][]
}): Promise<{ result: T[], total: number, success: boolean }> {
  const response = await dbExecute<T[]>({
    action: 'find',
    collection: 'events_store',
    query: { ...options.query, deletedAt: { $exists: false } },
    skip: options.skip ?? 0,
    limit: options.limit ?? 20,
    sort: options.sort ?? [['timestamp', -1]],
  })
  return { result: response.result, total: response.total ?? 0, success: response.success }
}
