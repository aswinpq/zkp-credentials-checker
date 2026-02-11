import { useEffect, useState } from 'react';
import { getHealth, type HealthData } from '../api/client';

export function HealthBar() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [error, setError] = useState('');

    const fetchHealth = async () => {
        try {
            const data = await getHealth();
            setHealth(data);
            setError('');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to connect');
        }
    };

    useEffect(() => {
        fetchHealth();
        const id = setInterval(fetchHealth, 15000);
        return () => clearInterval(id);
    }, []);

    const formatUptime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const formatMB = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;

    if (error) {
        return (
            <div className="card card-full">
                <div className="card-header">
                    <div className="card-icon amber">⚡</div>
                    <span className="card-title">System Health</span>
                </div>
                <div className="health-bar">
                    <span className="health-badge unhealthy">
                        <span className="health-dot" /> Offline
                    </span>
                    <span className="text-muted text-xs">{error}</span>
                </div>
            </div>
        );
    }

    if (!health) {
        return (
            <div className="card card-full">
                <div className="card-header">
                    <div className="card-icon blue">⚡</div>
                    <span className="card-title">System Health</span>
                </div>
                <div className="health-bar">
                    <span className="text-muted text-xs">Connecting...</span>
                </div>
            </div>
        );
    }

    const d = health.data;
    const status = d.status as 'healthy' | 'degraded' | 'unhealthy';

    return (
        <div className="card card-full">
            <div className="card-header">
                <div className="card-icon green">⚡</div>
                <span className="card-title">System Health</span>
            </div>
            <div className="health-bar">
                <span className={`health-badge ${status}`}>
                    <span className="health-dot" />
                    {status === 'healthy' ? 'Online' : status}
                </span>
                <div className="health-stats">
                    <div className="health-stat">
                        <span className="health-stat-label">Uptime</span>
                        <span className="health-stat-value">{formatUptime(d.uptime)}</span>
                    </div>
                    <div className="health-stat">
                        <span className="health-stat-label">Heap</span>
                        <span className="health-stat-value">
                            {formatMB(d.memory.heapUsed)} / {formatMB(d.memory.heapTotal)}
                        </span>
                    </div>
                    <div className="health-stat">
                        <span className="health-stat-label">Version</span>
                        <span className="health-stat-value">{d.version}</span>
                    </div>
                    <div className="health-stat">
                        <span className="health-stat-label">System</span>
                        <span className="health-stat-value">{d.checks.memory && d.checks.uptime ? '✓' : '⚠'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
