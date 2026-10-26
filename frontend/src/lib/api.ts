const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('niyamai_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('niyamai_token', token);
  } else {
    localStorage.removeItem('niyamai_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Clear token if expired or unauthorized
    setStoredToken(null);
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred.';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  // Handle blob or json
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.blob() as unknown as T;
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request<any>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // Applications
  getApplications: (params?: { category?: string; status?: string; academic_year?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.status) q.append('status', params.status);
    if (params?.academic_year) q.append('academic_year', params.academic_year);
    if (params?.search) q.append('search', params.search);
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<any[]>(`/applications${queryStr}`);
  },
  getApplication: (id: string) => request<any>(`/applications/${id}`),
  createApplication: (data: any) =>
    request<any>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateApplication: (id: string, data: any) =>
    request<any>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  submitApplication: (id: string) =>
    request<any>(`/applications/${id}/submit`, { method: 'POST' }),

  // Documents
  uploadDocument: (applicationId: string, documentType: string, file: File) => {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);
    return request<any>(`/applications/${applicationId}/documents`, {
      method: 'POST',
      body: formData,
    });
  },
  getDocument: (id: string) => request<any>(`/documents/${id}`),
  reprocessDocument: (id: string) => request<any>(`/documents/${id}/reprocess`, { method: 'POST' }),

  // Validation
  validateApplication: (id: string) =>
    request<any>(`/applications/${id}/validate`, { method: 'POST' }),
  getProcessingStatus: (id: string) =>
    request<any>(`/applications/${id}/processing-status`),
  getFindings: (applicationId: string, params?: { severity?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.severity) q.append('severity', params.severity);
    if (params?.status) q.append('status', params.status);
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<any[]>(`/applications/${applicationId}/findings${queryStr}`);
  },

  // Verification
  verifyDocument: (documentId: string, sourceName?: string) => {
    const q = sourceName ? `?source_name=${encodeURIComponent(sourceName)}` : '';
    return request<any>(`/documents/${documentId}/verify${q}`, { method: 'POST' });
  },
  getVerificationQueue: (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<any[]>(`/verification/queue${q}`);
  },

  // Officer Review
  reviewFinding: (findingId: string, data: { action_type: string; reason: string; notes?: string }) =>
    request<any>(`/findings/${findingId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  requestRectification: (applicationId: string, data: { rectification_notes: string; requested_fields: string[]; requested_documents: string[] }) =>
    request<any>(`/applications/${applicationId}/rectification`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getReviewHistory: (applicationId: string) =>
    request<any[]>(`/applications/${applicationId}/review-history`),

  // Regulatory Rules
  getRules: (params?: { category?: string; publication_status?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.publication_status) q.append('publication_status', params.publication_status);
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<any[]>(`/rules${queryStr}`);
  },
  createRule: (data: any) =>
    request<any>('/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  publishRule: (ruleId: string, reason: string) =>
    request<any>(`/rules/${ruleId}/publish?change_reason=${encodeURIComponent(reason)}`, {
      method: 'POST',
    }),
  getRuleVersions: (ruleId: string) =>
    request<any[]>(`/rules/${ruleId}/versions`),

  // Reports & Audit
  generateReport: (applicationId: string) =>
    request<{ message: string; filename: string; download_url: string; generated_by: string }>(
      `/applications/${applicationId}/reports`,
      { method: 'POST' }
    ),
  getAuditTrail: (applicationId: string) =>
    request<any[]>(`/applications/${applicationId}/audit`),
  getDashboardSummary: () => request<any>('/dashboard/summary'),
};
