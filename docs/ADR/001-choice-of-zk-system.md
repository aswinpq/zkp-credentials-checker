# ADR-001: Choice of ZK Proving System

## Status: Accepted
## Date: 2025-01-01

## Context
We need a ZK proving system for anonymous credential verification.

## Decision
Use **Groth16** via **snarkjs** for zero-knowledge proofs.

## Rationale
- Groth16 has constant-size proofs (~200 bytes) regardless of circuit size
- snarkjs is the most widely used JS implementation with active maintenance
- Verification is extremely fast (~10ms) — suitable for real-time APIs
- Battle-tested in production systems (Tornado Cash, Semaphore, etc.)

## Trade-offs
- Requires trusted setup ceremony (mitigated by multi-party computation)
- Circuit-specific: changes to the circuit require new setup
- Not quantum-resistant (acceptable for current threat model)

## Alternatives Considered
- **PLONK**: Universal setup but larger proofs and slower verification
- **STARKs**: No trusted setup but much larger proofs (100KB+)
- **Bulletproofs**: No trusted setup but slow verification
