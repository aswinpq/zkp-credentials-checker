import { useState } from 'react';
import { generateProof, type CredentialSet, type GenerateProofResponse } from '../api/client';

interface Props {
    sets: CredentialSet[];
}

export function ProofGenerator({ sets }: Props) {
    const [setId, setSetId] = useState('');
    const [credential, setCredential] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GenerateProofResponse | null>(null);
    const [error, setError] = useState('');

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setError('');
        try {
            const res = await generateProof({ credentialSetId: setId, credential });
            setResult(res);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Proof generation failed');
        } finally {
            setLoading(false);
        }
    };

    // Get credentials list for selected set
    const selectedSet = sets.find((s) => s.id === setId);

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-icon green">🔐</div>
                <span className="card-title">Generate Proof</span>
            </div>

            <form onSubmit={handleGenerate}>
                <div className="form-group">
                    <label className="form-label">Credential Set</label>
                    <select
                        className="form-select"
                        value={setId}
                        onChange={(e) => {
                            setSetId(e.target.value);
                            setCredential('');
                            setResult(null);
                            setError('');
                        }}
                        required
                    >
                        <option value="">Select a set…</option>
                        {sets.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.credentials.length} credentials)
                            </option>
                        ))}
                    </select>
                </div>

                {selectedSet && (
                    <div className="form-group">
                        <label className="form-label">Credential</label>
                        <select
                            className="form-select"
                            value={credential}
                            onChange={(e) => setCredential(e.target.value)}
                            required
                        >
                            <option value="">Select a credential…</option>
                            {selectedSet.credentials.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <button
                    className="btn btn-primary btn-block"
                    type="submit"
                    disabled={loading || !setId || !credential}
                >
                    {loading ? <span className="spinner" /> : '🛡️'} Generate Merkle Proof
                </button>
            </form>

            {error && (
                <div className="result-box error">
                    <div className="result-title invalid">✕ Error</div>
                    <span className="text-xs">{error}</span>
                </div>
            )}

            {result && (
                <div className="result-box success">
                    <div className="flex-between">
                        <div className="result-title valid">✓ Proof Generated</div>
                        <button
                            className="btn btn-secondary btn-sm"
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
                            }}
                            title="Copy full JSON for verification"
                        >
                            📋 Copy JSON
                        </button>
                    </div>
                    <div className="result-json">
                        {JSON.stringify(result.data, null, 2)}
                    </div>
                </div>
            )}
        </div>
    );
}
