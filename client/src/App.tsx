import { useState } from 'react';
import { HealthBar } from './components/HealthBar';
import { CredentialSets } from './components/CredentialSets';
import { ProofGenerator } from './components/ProofGenerator';
import { ProofVerifier } from './components/ProofVerifier';
import type { CredentialSet } from './api/client';

function App() {
  const [sets, setSets] = useState<CredentialSet[]>([]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">🛡️</div>
          <h1 className="app-title">ZKP Credentials Checker</h1>
        </div>
        <p className="app-subtitle">
          Zero-Knowledge Proof credential verification dashboard
        </p>
      </header>

      <div className="dashboard">
        <HealthBar />
        <CredentialSets onSetsChange={setSets} />
        <ProofGenerator sets={sets} />
        <ProofVerifier />
      </div>
    </div>
  );
}

export default App;
