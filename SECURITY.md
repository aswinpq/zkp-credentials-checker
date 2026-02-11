# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x.x   | Yes       |

## Reporting a Vulnerability

**DO NOT** create public GitHub issues for security vulnerabilities.

Send reports to: security@yourcompany.com

Include:
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

Response time: within 48 hours.

## Security Measures

### Cryptographic
- Audited libraries (merkletreejs, snarkjs)
- Constant-time comparisons (`timingSafeEqual`)
- Secure random number generation (Node.js `crypto`)
- SHA-256 with sorted pairs for Merkle trees
- Domain-separated leaf/node hashing

### Application
- Input validation on all endpoints (express-validator)
- Tiered rate limiting (global, proof generation, verification)
- Helmet.js security headers (CSP, HSTS, nosniff, etc.)
- CORS with strict origin policy
- Request size limits (10KB)
- Custom error hierarchy (no internal stack trace leaks)

### ZK-Specific
- Proof expiration (24 hours default)
- Trusted root management with expiration
- Nullifier support to prevent double-use
- Circuit versioning

## Trusted Setup

Production deployments require a multi-party trusted setup ceremony:

```bash
bash scripts/setup-circuits.sh
```

Requirements:
- 50+ independent participants
- Geographic distribution
- Every contribution verified
- Ceremony transcript published

## Dependencies

All dependencies are scanned:
- `npm audit` on every commit
- Only well-maintained, widely-used packages
- No known vulnerabilities at time of release
