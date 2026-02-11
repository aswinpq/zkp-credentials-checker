# ADR-002: Merkle Tree Library

## Status: Accepted
## Date: 2025-01-01

## Context
Need a Merkle tree for credential set membership proofs.

## Decision
Use **merkletreejs** with SHA-256, sorted pairs, and duplicate-odd.

## Rationale
- Most downloaded Merkle tree library (1M+ weekly downloads)
- Supports configurable hash functions
- `sortPairs: true` prevents second preimage attacks
- Well-documented and actively maintained
- Used in production Ethereum projects

## Security Configuration
- `sortPairs: true` - canonical ordering prevents attack vectors
- `duplicateOdd: true` - handles odd leaf counts securely
- `hashLeaves: false` - we pre-hash for domain separation control
- SHA-256 via Node.js `crypto` module (FIPS-validated)
