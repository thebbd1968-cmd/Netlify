/**
 * API client for the Douglas Real Estate Systems backend.
 * All calls go through /api proxy (configured in vite.config.ts).
 */

const BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers['token'] = token
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API error ${res.status}: ${body}`)
  }

  return res.json()
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; token_type: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: { email: string; password: string; name: string; role?: string }) =>
      request<{ access_token: string; token_type: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<import('../types').User>('/auth/me'),
  },

  // ─── Contacts ──────────────────────────────────────────────────────────────

  contacts: {
    list: (params?: { skip?: number; limit?: number; status?: string }) => {
      const q = new URLSearchParams()
      if (params?.skip) q.set('skip', String(params.skip))
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.status) q.set('status', params.status)
      return request<import('../types').Contact[]>(`/contacts?${q}`)
    },
    get: (id: string) => request<import('../types').Contact>(`/contacts/${id}`),
    create: (data: Partial<import('../types').Contact>) =>
      request<import('../types').Contact>('/contacts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<import('../types').Contact>) =>
      request<import('../types').Contact>(`/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ message: string }>(`/contacts/${id}`, { method: 'DELETE' }),
  },

  // ─── Properties ───────────────────────────────────────────────────────────

  properties: {
    list: (params?: { skip?: number; limit?: number; status?: string }) => {
      const q = new URLSearchParams()
      if (params?.skip) q.set('skip', String(params.skip))
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.status) q.set('status', params.status)
      return request<import('../types').Property[]>(`/properties?${q}`)
    },
    get: (id: string) => request<import('../types').Property>(`/properties/${id}`),
    create: (data: Partial<import('../types').Property>) =>
      request<import('../types').Property>('/properties', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<import('../types').Property>) =>
      request<import('../types').Property>(`/properties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ message: string }>(`/properties/${id}`, { method: 'DELETE' }),
    analyze: (id: string) =>
      request<import('../types').Property>(`/properties/${id}/analyze`, { method: 'POST' }),
  },

  // ─── Deals ─────────────────────────────────────────────────────────────────

  deals: {
    list: (params?: { skip?: number; limit?: number; stage?: string; status?: string }) => {
      const q = new URLSearchParams()
      if (params?.skip) q.set('skip', String(params.skip))
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.stage) q.set('stage', params.stage)
      if (params?.status) q.set('status', params.status)
      return request<import('../types').Deal[]>(`/deals?${q}`)
    },
    get: (id: string) => request<import('../types').Deal>(`/deals/${id}`),
    create: (data: Partial<import('../types').Deal>) =>
      request<import('../types').Deal>('/deals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<import('../types').Deal>) =>
      request<import('../types').Deal>(`/deals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ message: string }>(`/deals/${id}`, { method: 'DELETE' }),
    pipelineSummary: () => request<Record<string, number>>('/deals/pipeline/summary'),
  },

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  tasks: {
    list: (params?: { skip?: number; limit?: number; status?: string; deal_id?: string }) => {
      const q = new URLSearchParams()
      if (params?.skip) q.set('skip', String(params.skip))
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.status) q.set('status', params.status)
      if (params?.deal_id) q.set('deal_id', params.deal_id)
      return request<import('../types').Task[]>(`/tasks?${q}`)
    },
    get: (id: string) => request<import('../types').Task>(`/tasks/${id}`),
    create: (data: Partial<import('../types').Task>) =>
      request<import('../types').Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<import('../types').Task>) =>
      request<import('../types').Task>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    complete: (id: string) =>
      request<import('../types').Task>(`/tasks/${id}/complete`, { method: 'POST' }),
    delete: (id: string) => request<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' }),
  },

  // ─── Portfolios ────────────────────────────────────────────────────────────

  portfolios: {
    list: (params?: { skip?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.skip) q.set('skip', String(params.skip))
      if (params?.limit) q.set('limit', String(params.limit))
      return request<import('../types').Portfolio[]>(`/portfolios?${q}`)
    },
    get: (id: string) => request<import('../types').Portfolio>(`/portfolios/${id}`),
    create: (data: { name: string; description?: string }) =>
      request<import('../types').Portfolio>('/portfolios', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<import('../types').Portfolio>) =>
      request<import('../types').Portfolio>(`/portfolios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ message: string }>(`/portfolios/${id}`, { method: 'DELETE' }),
    listProperties: (id: string) =>
      request<import('../types').Property[]>(`/portfolios/${id}/properties`),
    addProperty: (portfolioId: string, propertyId: string) =>
      request<import('../types').Property>(`/portfolios/${portfolioId}/properties/${propertyId}`, {
        method: 'POST',
      }),
    removeProperty: (portfolioId: string, propertyId: string) =>
      request<{ message: string }>(`/portfolios/${portfolioId}/properties/${propertyId}`, {
        method: 'DELETE',
      }),
  },

  // ─── Viktor Tools ─────────────────────────────────────────────────────────

  tools: {
    analyzeAndDraft: (data: { address: string; contact_id?: string; message_type?: string }) =>
      request<{ analysis: any; drafted_message: any }>('/tools/analyze-and-draft', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    quickAnalyze: (data: { purchase_price: number; monthly_rent: number; estimated_value?: number; hoa_dues?: number }) =>
      request<{ cap_rate: number; cash_on_cash_return?: number; gross_yield?: number }>('/tools/quick-analyze', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Viktor Webhooks ──────────────────────────────────────────────────────

  webhooks: {
    sendEvent: (event_type: string, payload: any) =>
      request<{ event_id: string; status: string }>('/webhooks/viktor/event', {
        method: 'POST',
        body: JSON.stringify({ event_type, payload }),
      }),
    updateContactStatus: (contact_id: string, lead_status: string, notes?: string) =>
      request<{ message: string }>('/webhooks/viktor/update-contact-status', {
        method: 'POST',
        body: JSON.stringify({ contact_id, lead_status, notes }),
      }),
    listEvents: (limit?: number) =>
      request<any[]>(`/webhooks/viktor/events${limit ? `?limit=${limit}` : ''}`),
  },

  // ─── Analysis ─────────────────────────────────────────────────────────────

  analysis: {
    calculate: (data: {
      purchase_price: number
      monthly_rent: number
      monthly_expenses?: number
      hoa_dues?: number
      estimated_value?: number
      down_payment_percent?: number
    }) =>
      request<{
        cap_rate: number
        cash_on_cash_return?: number
        gross_yield?: number
        monthly_cash_flow: number
      }>('/analysis/calculate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    lookup: (address: string) =>
      request<{
        estimated_value?: number
        estimated_rent?: number
        neighborhood?: string
      }>(`/analysis/lookup?address=${encodeURIComponent(address)}`),
  },

  // ─── Reports ──────────────────────────────────────────────────────────────

  reports: {
    gci: (timeframe: 'month' | 'quarter' | 'year' = 'month') =>
      request<{
        total_gci: number
        pending_gci: number
        closed_deals_count: number
        active_deals_count: number
        pipeline_value: number
      }>(`/reports/gci?timeframe=${timeframe}`),
    summary: () =>
      request<{
        deals: any
        contacts: number
        properties: number
        tasks: any
      }>('/reports/summary'),
  },

  // ─── Nurture (Auto Follow-ups) ────────────────────────────────────────────

  nurture: {
    list: () => request<any[]>('/nurture'),
    get: (id: string) => request<any>(`/nurture/${id}`),
    create: (data: any) =>
      request<any>('/nurture', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/nurture/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/nurture/${id}`, { method: 'DELETE' }),
    checkTriggers: (contact_id?: string) =>
      request<any[]>(`/nurture/check-triggers${contact_id ? `?contact_id=${contact_id}` : ''}`),
    send: (sequence_id: string, contact_id: string, step: number, channel: string, message_body: string, subject?: string) => {
      const params = new URLSearchParams({ sequence_id, contact_id, step: String(step), channel, message_body })
      if (subject) params.set('subject', subject)
      return request<{ message: string }>(`/nurture/send?${params}`, { method: 'POST' })
    },
    logs: (params?: { contact_id?: string; sequence_id?: string; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.contact_id) q.set('contact_id', params.contact_id)
      if (params?.sequence_id) q.set('sequence_id', params.sequence_id)
      if (params?.limit) q.set('limit', String(params.limit))
      return request<any[]>(`/nurture/logs?${q}`)
    },
    logResponse: (log_id: string, response_status: string) =>
      request<{ message: string }>(`/nurture/log-response?log_id=${log_id}&response_status=${response_status}`, { method: 'POST' }),
    templates: () => request<any[]>('/nurture/templates/defaults'),
  },
}
