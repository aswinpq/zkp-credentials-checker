# Anonymous Credential Checker

A production-grade zero-knowledge credential verification system using Merkle trees and Groth16 proofs. Enables anonymous proof of membership in a credential set without revealing which credential is held.

## Overview

This system allows:
- **Issuers** to define credential sets (e.g., approved universities, companies)
- **Holders** to prove membership in a set without revealing their specific credential
- **Verifiers** to confirm membership claims cryptographically without learning any private information

## Architecture

```
Client (Prover)          Server (Verifier)
     |                         |
     |--- Create Cred Set ---->|  (admin)
     |<-- Set ID + Root -------|
     |                         |
     |--- Generate Proof ----->|  (with credential)
     |<-- ZK Proof ------------|
     |                         |
     |--- Verify Proof ------->|  (anyone)
     |<-- Valid/Invalid -------|
```

### Core Components

| Module | Description |
|--------|-------------|
| `core/merkle/` | Secure Merkle tree with SHA-256 and constant-time verification |
| `core/prover/` | Groth16 ZK proof generation via snarkjs |
| `core/verifier/` | Multi-stage proof verification pipeline |
| `core/crypto/` | Hash management, secure randomness, key derivation |
| `api/` | Express server with Helmet, rate limiting, input validation |

## Quick Start

### Prerequisites
- Node.js >= 20
- npm >= 10

### Installation

```bash
npm install
```

### Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format
npm run format
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/proof/credential-sets` | Create credential set |
| `GET` | `/api/proof/credential-sets` | List credential sets |
| `POST` | `/api/proof/generate` | Generate ZK proof |
| `POST` | `/api/verify` | Verify a ZK proof |
| `POST` | `/api/verify/roots` | Register trusted root |

### Circuit Setup (for ZK proofs)

ZK proof generation requires compiled Circom circuits:

```bash
# Requires circom and snarkjs installed globally
bash scripts/setup-circuits.sh
```

## Security

- SHA-256 with sorted Merkle tree pairs (second preimage attack prevention)
- Constant-time comparisons via `timingSafeEqual`
- Helmet.js security headers
- Tiered rate limiting
- Input validation on all endpoints
- API key authentication
- Custom error hierarchy (no internal leaks)

See [SECURITY.md](SECURITY.md) for the full security policy.

## Testing

```bash
npm test                  # All tests
npm run test:coverage     # With coverage report
```

Test suites:
- `tests/unit/` - Merkle tree, crypto, prover, verifier
- `tests/integration/` - E2E flow, API endpoints
- `tests/security/` - Timing attacks, input validation, crypto properties
- `tests/performance/` - Benchmarks

## Project Structure

```
src/
  core/
    merkle/       SecureMerkleTree, CredentialSetManager
    prover/       ZKProver, CircuitManager, ProofSerializer
    verifier/     ZKVerifier, RootManager, ProofValidator
    crypto/       HashManager, RandomGenerator, KeyManager
  api/
    server.ts     Express server with security middleware
    routes/       proof, verify, health endpoints
    controllers/  Business logic handlers
    middleware/   Auth, rate limit, validation, security, error
  config/         Environment, security, circuits config
  utils/          Logger, errors, validators
  types/          TypeScript interfaces
circuits/         Circom circuit and setup scripts
tests/            Unit, integration, security, performance tests
```

## License

MIT
