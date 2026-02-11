/* ───────────────────────────────────────────────
   API Client — typed wrappers for backend endpoints
   ─────────────────────────────────────────────── */

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json.error?.message || `Request failed (${res.status})`);
    }
    return json;
}

/* ── Types ────────────────────────────────────── */

export interface HealthData {
    success: boolean;
    data: {
        status: string;
        version: string;
        uptime: number;
        timestamp: string;
        checks: { memory: boolean; uptime: boolean };
        memory: { heapUsed: number; heapTotal: number; rss: number };
    };
}

export interface CredentialSet {
    id: string;
    name: string;
    description: string;
    credentials: string[];
    merkleRoot: string;
    createdAt: string;
    version: string;
}

export interface CredentialSetListResponse {
    success: boolean;
    data: CredentialSet[];
}

export interface CreateSetResponse {
    success: boolean;
    data: CredentialSet;
}

export interface GenerateProofResponse {
    success: boolean;
    data: {
        credentialSetId: string;
        credential: string;
        merkleProof: {
            leaf: string;
            leafIndex: number;
            root: string;
            siblings: { hash: string; position: string }[];
            pathIndices: number[];
        };
    };
}

export interface VerifyResult {
    success: boolean;
    data: {
        valid: boolean;
        verifiedAt: string;
        credentialSetId: string;
        errors?: string[];
        warnings?: string[];
    };
}

/* ── Endpoints ───────────────────────────────── */

export async function getHealth(): Promise<HealthData> {
    return request<HealthData>('/health');
}

export async function listCredentialSets(): Promise<CredentialSetListResponse> {
    return request<CredentialSetListResponse>('/proof/credential-sets');
}

export async function createCredentialSet(body: {
    name: string;
    credentials: string[];
    description?: string;
    type?: string;
}): Promise<CreateSetResponse> {
    return request<CreateSetResponse>('/proof/credential-sets', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function generateProof(body: {
    credentialSetId: string;
    credential: string;
}): Promise<GenerateProofResponse> {
    return request<GenerateProofResponse>('/proof/generate', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function addTrustedRoot(body: {
    credentialSetId: string;
    merkleRoot: string;
}): Promise<unknown> {
    return request('/verify/roots', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
