import { useEffect, useState, useCallback } from 'react';
import {
    listCredentialSets,
    createCredentialSet,
    type CredentialSet,
} from '../api/client';

interface Props {
    onSetsChange?: (sets: CredentialSet[]) => void;
}

export function CredentialSets({ onSetsChange }: Props) {
    const [sets, setSets] = useState<CredentialSet[]>([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('CUSTOM');
    const [creds, setCreds] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchSets = useCallback(async () => {
        try {
            const res = await listCredentialSets();
            setSets(res.data);
            onSetsChange?.(res.data);
        } catch {
            /* silent */
        }
    }, [onSetsChange]);

    useEffect(() => {
        fetchSets();
    }, [fetchSets]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const credentials = creds
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean);
            if (credentials.length === 0) {
                setMsg({ type: 'error', text: 'Enter at least one credential' });
                setLoading(false);
                return;
            }
            await createCredentialSet({
                name,
                credentials,
                description: description || undefined,
                type,
            });
            setMsg({ type: 'success', text: `Credential set "${name}" created` });
            setName('');
            setDescription('');
            setCreds('');
            fetchSets();
        } catch (err: unknown) {
            setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Create Form */}
            <div className="card">
                <div className="card-header">
                    <div className="card-icon blue">📋</div>
                    <span className="card-title">Create Credential Set</span>
                </div>
                <form onSubmit={handleCreate}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input
                                className="form-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Top Universities"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <select
                                className="form-select"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="CUSTOM">Custom</option>
                                <option value="UNIVERSITIES">Universities</option>
                                <option value="COMPANIES">Companies</option>
                                <option value="CERTIFICATIONS">Certifications</option>
                                <option value="MEMBERSHIPS">Memberships</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description (optional)</label>
                        <input
                            className="form-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Credentials (one per line)</label>
                        <textarea
                            className="form-textarea"
                            value={creds}
                            onChange={(e) => setCreds(e.target.value)}
                            placeholder={'MIT\nStanford\nHarvard\nBerkeley'}
                            rows={4}
                            required
                        />
                    </div>
                    <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                        {loading ? <span className="spinner" /> : '＋'} Create Set
                    </button>
                </form>
                {msg && (
                    <div className={`result-box ${msg.type === 'success' ? 'success' : 'error'}`}>
                        <span className="text-xs">{msg.text}</span>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="card">
                <div className="card-header flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div className="card-icon purple">🗂️</div>
                        <span className="card-title">Credential Sets</span>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={fetchSets}>
                        ↻ Refresh
                    </button>
                </div>

                {sets.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <div>No credential sets yet. Create one to get started.</div>
                    </div>
                ) : (
                    <table className="sets-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Count</th>
                                <th>Merkle Root</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sets.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</td>
                                    <td>{s.credentials.length}</td>
                                    <td className="hash-cell" title={s.merkleRoot}>
                                        {s.merkleRoot.slice(0, 8)}…{s.merkleRoot.slice(-6)}
                                    </td>
                                    <td>{new Date(s.createdAt).toLocaleTimeString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
