export async function dbExecute<T = any>(payload: any): Promise<{ result: T, total?: number, success: boolean, message?: string }> {
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
      throw new Error(`HTTP Error: ${response.status}`)
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
