import { useState } from 'react';
import { addTrustedRoot } from '../api/client';

export function ProofVerifier() {
    const [proofJson, setProofJson] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        valid: boolean;
        verifiedAt?: string;
        errors?: string[];
    } | null>(null);
    const [error, setError] = useState('');

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setError('');
        try {
            let body: any;
            try {
                body = JSON.parse(proofJson);
                // Handle wrapped response from Generate Proof endpoint
                if (body && body.data && body.data.proof) {
                    body = body.data;
                }
            } catch {
                setError('Invalid JSON — paste a valid proof object');
                setLoading(false);
                return;
            }

            const res = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const json = await res.json();

            if (json.data) {
                setResult({
                    valid: json.data.valid,
                    verifiedAt: json.data.verifiedAt,
                    errors: json.data.errors,
                });
            } else {
                setError(json.error?.message || 'Verification request failed');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const loadExample = () => {
        setProofJson(
            JSON.stringify(
                {
                    proof: '<base64-encoded proof>',
                    publicSignals: ['<signal1>', '<signal2>'],
                    metadata: {
                        proofId: '00000000-0000-0000-0000-000000000000',
                        credentialSetId: '00000000-0000-0000-0000-000000000000',
                        merkleRoot: '0'.repeat(64),
                        timestamp: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 86400000).toISOString(),
                        version: '1.0.0',
                        circuitId: 'credential',
                    },
                },
                null,
                2,
            ),
        );
        setResult(null);
        setError('');
    };

    const handleTrust = async () => {
        try {
            setLoading(true);
            let body: any;
            try {
                body = JSON.parse(proofJson);
                if (body && body.data && body.data.proof) {
                    body = body.data;
                }
            } catch {
                return;
            }

            if (!body.metadata?.credentialSetId || !body.metadata?.merkleRoot) {
                setError('Cannot find credential set ID or Merkle root in proof');
                setLoading(false);
                return;
            }

            await addTrustedRoot({
                credentialSetId: body.metadata.credentialSetId,
                merkleRoot: body.metadata.merkleRoot,
            });

            // Re-verify
            const e = { preventDefault: () => { } } as React.FormEvent;
            handleVerify(e);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to trust root');
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div className="card-icon amber">🔍</div>
                    <span className="card-title">Verify Proof</span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={loadExample} type="button">
                    Load Example
                </button>
            </div>

            <form onSubmit={handleVerify}>
                <div className="form-group">
                    <label className="form-label">Proof JSON</label>
                    <textarea
                        className="form-textarea"
                        value={proofJson}
                        onChange={(e) => {
                            setProofJson(e.target.value);
                            setResult(null);
                            setError('');
                        }}
                        placeholder='Paste proof JSON here...'
                        rows={8}
                        required
                    />
                </div>
                <button
                    className="btn btn-primary btn-block"
                    type="submit"
                    disabled={loading || !proofJson.trim()}
                >
                    {loading ? <span className="spinner" /> : '✔'} Verify Proof
                </button>
            </form>

            {error && (
                <div className="result-box error">
                    <div className="result-title invalid">✕ Error</div>
                    <span className="text-xs">{error}</span>
                </div>
            )}

            {result && (
                <div className={`result-box ${result.valid ? 'success' : 'error'}`}>
                    <div className={`result-title ${result.valid ? 'valid' : 'invalid'}`}>
                        {result.valid ? '✓ Proof is Valid' : '✕ Proof is Invalid'}
                    </div>
                    {result.verifiedAt && (
                        <div className="text-xs text-muted mt-sm">
                            Verified at: {new Date(result.verifiedAt).toLocaleString()}
                        </div>
                    )}
                    {result.errors && result.errors.length > 0 && (
                        <div className="mt-sm text-xs" style={{ color: 'var(--danger)' }}>
                            {result.errors.map((e, i) => (
                                <div key={i}>• {e}</div>
                            ))}
                            {result.errors.some((e) => e.includes('Untrusted credential set root')) && (
                                <div className="mt-md">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleTrust}
                                        type="button"
                                        disabled={loading}
                                    >
                                        🛡️ Trust this Root
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
