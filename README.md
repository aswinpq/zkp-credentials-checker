# ZK Credentials Checker

## Overview

The **ZK Credentials Checker** is a privacy-preserving application designed to verify credentials using Zero-Knowledge Proofs (ZKPs). This system allows users to prove the validity of their credentials without revealing the underlying sensitive data. By leveraging Circom for circuit definition and SnarkJS for proof generation and verification, we ensure a secure and trustless verification process.

## Key Features

- **Privacy-Preserving Verification**: Users can prove they possess valid credentials without exposing the actual data.
- **Zero-Knowledge Proofs**: Utilizes zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Argument of Knowledge) for efficient and secure proofs.
- **Credential Integrity**: Ensures that the credentials being verified have not been tampered with.
- **Scalable Architecture**: Designed to handle multiple credential types and verification scenarios.

## Project Structure

- `circuits/`: Contains the Circom circuit definitions (`.circom`) and compilation scripts.
- `src/`: Source code for the application logic, including proof generation and verification handlers.
- `tests/`: Unit and integration tests to ensure system reliability.
- `scripts/`: Utility scripts for setup, key generation, and deployment.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Rust (for Circom compiler)
- Circom 2.0+

### Installation

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
