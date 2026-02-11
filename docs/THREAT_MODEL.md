# Threat Model

## Assets
- Credential privacy (which credential a prover holds)
- Merkle roots integrity (trusted set definitions)
- Proof validity (soundness of ZK proofs)
- API availability

## Threat Actors
1. **Malicious Prover** - tries to forge proofs for credentials they don't hold
2. **External Attacker** - tries to compromise API or extract information
3. **Compromised Admin** - attempts to manipulate trusted roots

## Threats and Mitigations

| Threat | Impact | Mitigation |
|--------|--------|------------|
| Proof forgery | High | Groth16 soundness; circuit constraints |
| Timing side-channel | Medium | `timingSafeEqual` for all comparisons |
| Replay attack | Medium | Proof expiration (24h); nullifier support |
| DoS via proof generation | Medium | Rate limiting (10/min for proof gen) |
| Root manipulation | High | Admin auth required; root expiration |
| Input injection | Medium | express-validator on all inputs |
| Credential enumeration | Low | Generic error messages; no info leak |
| Dependency supply chain | High | npm audit; lockfile; CI scanning |

## Assumptions
- Node.js `crypto` module provides CSPRNG
- snarkjs Groth16 implementation is correct
- Trusted setup ceremony was performed honestly (at least 1 honest participant)
