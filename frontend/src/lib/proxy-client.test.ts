/**
 * @file proxy-client.test.ts
 *
 * Testa o proxy client HTTP: dbExecute, fileToBase64, fetchEntityEvents, fetchEventStoreLogs.
 * Usa mocks de fetch e localStorage.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'


// ─── Setup ───────────────────────────────────────────────────────

let mockFetch: ReturnType<typeof vi.fn>
let mockLocalStorage: Record<string, any>

beforeEach(() => {
  mockFetch = vi.fn()
  vi.stubGlobal('fetch', mockFetch)

  mockLocalStorage = {
    _store: {} as Record<string, string>,
    getItem: vi.fn((key: string) => mockLocalStorage._store[key] ?? null),
    setItem: vi.fn((key: string, val: string) => { mockLocalStorage._store[key] = val }),
    removeItem: vi.fn((key: string) => { delete mockLocalStorage._store[key] }),
  }
  vi.stubGlobal('localStorage', mockLocalStorage)
})

afterEach(() => {
  vi.restoreAllMocks()
})

function jsonResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    blob: () => Promise.resolve(new Blob()),
  })
}


// ─── dbExecute ───────────────────────────────────────────────────

describe('dbExecute', () => {
  it('envia metadata no header x-db-meta e data no body', async () => {
    mockLocalStorage._store['auth_token'] = 'token'
    mockFetch.mockReturnValue(jsonResponse({ result: [], total: 0, success: true }))

    // Dynamic import to pick up fresh mocks
    const { dbExecute } = await import('@/lib/proxy-client')
    await dbExecute({
      action: 'find',
      collection: 'patients',
      query: { name: 'Test' },
      data: { extra: 'value' },
    })

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('/db/execute')

    const meta = JSON.parse(options.headers['x-db-meta'])
    expect(meta.action).toBe('find')
    expect(meta.collection).toBe('patients')
    expect(meta.query).toEqual({ name: 'Test' })
    expect(meta.data).toBeUndefined() // data NÃO vai no header

    const body = JSON.parse(options.body)
    expect(body.data).toEqual({ extra: 'value' })
  })

  it('inclui Authorization header quando token existe', async () => {
    mockLocalStorage._store['auth_token'] = 'my-jwt'
    mockFetch.mockReturnValue(jsonResponse({ result: null, success: true }))

    const { dbExecute } = await import('@/lib/proxy-client')
    await dbExecute({ action: 'find', collection: 'test' })

    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['Authorization']).toBe('Bearer my-jwt')
  })

  it('não inclui Authorization quando token é null', async () => {
    // _store vazio = getItem retorna null
    mockFetch.mockReturnValue(jsonResponse({ result: null, success: true }))

    const { dbExecute } = await import('@/lib/proxy-client')
    await dbExecute({ action: 'find', collection: 'test' })

    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['Authorization']).toBeUndefined()
  })

  it('retorna resultado parseado do JSON', async () => {
    mockFetch.mockReturnValue(jsonResponse({
      result: [{ name: 'Alice' }],
      total: 1,
      success: true,
    }))

    const { dbExecute } = await import('@/lib/proxy-client')
    const res = await dbExecute({ action: 'find', collection: 'patients' })

    expect(res.success).toBe(true)
    expect(res.total).toBe(1)
    expect(res.result).toHaveLength(1)
    expect(res.result[0].name).toBe('Alice')
  })

  it('throw em HTTP error (status != 2xx)', async () => {
    mockFetch.mockReturnValue(jsonResponse({ error: 'Internal failure' }, 500))

    const { dbExecute } = await import('@/lib/proxy-client')
    await expect(
      dbExecute({ action: 'find', collection: 'test' })
    ).rejects.toThrow('Internal failure')
  })

  it('limpa auth e redireciona em 401', async () => {
    mockLocalStorage._store['auth_token'] = 'token'
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    })

    mockFetch.mockReturnValue(jsonResponse({}, 401))

    const { dbExecute } = await import('@/lib/proxy-client')
    await expect(
      dbExecute({ action: 'find', collection: 'test' })
    ).rejects.toThrow('Unauthorized')

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user')
  })

  it('envia data vazio quando não fornecido', async () => {
    mockFetch.mockReturnValue(jsonResponse({ result: null, success: true }))

    const { dbExecute } = await import('@/lib/proxy-client')
    await dbExecute({ action: 'find', collection: 'test' })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.data).toEqual({})
  })
})


// ─── fetchEntityEvents ──────────────────────────────────────────

describe('fetchEntityEvents', () => {
  it('chama GET /db/events/{type}/{id}', async () => {
    mockLocalStorage._store['auth_token'] = 'jwt'
    mockFetch.mockReturnValue(jsonResponse({
      result: [{ eventType: 'CREATE' }],
      total: 1,
      success: true,
    }))

    const { fetchEntityEvents } = await import('@/lib/proxy-client')
    const res = await fetchEntityEvents('patients', 'abc123')

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('/db/events/patients/abc123')
    expect(options.headers['Authorization']).toBe('Bearer jwt')
    expect(res.total).toBe(1)
  })

  it('throw em 401 com cleanup de auth', async () => {
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    })
    mockFetch.mockReturnValue(jsonResponse({}, 401))

    const { fetchEntityEvents } = await import('@/lib/proxy-client')
    await expect(
      fetchEntityEvents('patients', 'abc123')
    ).rejects.toThrow('Unauthorized')
  })
})


// ─── fetchEventStoreLogs ────────────────────────────────────────

describe('fetchEventStoreLogs', () => {
  it('usa dbExecute com collection events_store', async () => {
    mockFetch.mockReturnValue(jsonResponse({
      result: [{ eventType: 'CREATE', version: 1 }],
      total: 1,
      success: true,
    }))

    const { fetchEventStoreLogs } = await import('@/lib/proxy-client')
    const res = await fetchEventStoreLogs({ skip: 0, limit: 10 })

    const meta = JSON.parse(mockFetch.mock.calls[0][1].headers['x-db-meta'])
    expect(meta.action).toBe('find')
    expect(meta.collection).toBe('events_store')
    expect(meta.skip).toBe(0)
    expect(meta.limit).toBe(10)
    expect(res.total).toBe(1)
  })

  it('aplica defaults para skip, limit e sort', async () => {
    mockFetch.mockReturnValue(jsonResponse({ result: [], total: 0, success: true }))

    const { fetchEventStoreLogs } = await import('@/lib/proxy-client')
    await fetchEventStoreLogs({})

    const meta = JSON.parse(mockFetch.mock.calls[0][1].headers['x-db-meta'])
    expect(meta.skip).toBe(0)
    expect(meta.limit).toBe(20)
    expect(meta.sort).toEqual([['timestamp', -1]])
  })
})


// ─── fileToBase64 ───────────────────────────────────────────────

describe('fileToBase64', () => {
  it('converte File para objeto com base64', async () => {
    const { fileToBase64 } = await import('@/lib/proxy-client')
    const file = new File(['Hello World'], 'test.txt', { type: 'text/plain' })

    const result = await fileToBase64(file)

    expect(result.name).toBe('test.txt')
    expect(result.type).toBe('text/plain')
    expect(result.size).toBe(file.size)
    expect(typeof result.data).toBe('string')
  })

  it('retorna metadata correta para PDF', async () => {
    const { fileToBase64 } = await import('@/lib/proxy-client')
    const file = new File(['pdf-content'], 'doc.pdf', { type: 'application/pdf' })

    const result = await fileToBase64(file)

    expect(result.name).toBe('doc.pdf')
    expect(result.type).toBe('application/pdf')
  })
})
