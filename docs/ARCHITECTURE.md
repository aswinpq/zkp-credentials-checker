# Architecture

## System Overview

The Anonymous Credential Checker is a zero-knowledge proof system that allows users to prove membership in a credential set without revealing which specific credential they hold.

## Component Architecture

```
+------------------+     +------------------+     +------------------+
|   API Layer      |     |   Core Layer     |     |   Circuit Layer  |
|                  |     |                  |     |                  |
|  Express Server  |---->|  Credential Set  |     |  Circom Circuit  |
|  Middleware      |     |  Merkle Tree     |     |  Groth16 Setup   |
|  Routes          |---->|  ZK Prover       |---->|  WASM + zkey     |
|  Controllers     |     |  ZK Verifier     |     |  Verification Key|
|  Error Handler   |     |  Root Manager    |     |                  |
+------------------+     +------------------+     +------------------+
         |                        |
         v                        v
+------------------+     +------------------+
|   Config Layer   |     |   Crypto Layer   |
|                  |     |                  |
|  Environment     |     |  HashManager     |
|  Security Config |     |  RandomGenerator |
|  Circuit Config  |     |  KeyManager      |
+------------------+     +------------------+
```

## Data Flow

### Proof Generation
1. Client sends credential + credential set ID
2. Server looks up credential in set, finds leaf index
3. Merkle proof generated from tree
4. ZK proof generated via Groth16 (snarkjs)
5. Proof returned with metadata (expiry, IDs)

### Proof Verification
1. Client sends proof + public signals + metadata
2. Proof structure validated
3. Expiration checked
4. Root checked against trusted roots
5. Groth16 cryptographic verification
6. Result returned

## Security Model

- **Prover privacy**: ZK proof reveals nothing about which leaf is held
- **Verifier assurance**: Groth16 soundness guarantees only valid set members can produce proofs
- **Replay prevention**: Proof expiration + nullifier support
- **Root trust**: Only admin-registered roots accepted

## Key Decisions

See `docs/ADR/` for Architecture Decision Records.
