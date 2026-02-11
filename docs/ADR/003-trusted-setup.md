# ADR-003: Trusted Setup Process

## Status: Accepted
## Date: 2025-01-01

## Context
Groth16 requires a trusted setup ceremony. A compromised setup allows proof forgery.

## Decision
Require multi-party computation (MPC) with minimum 50 participants.

## Rationale
- Security only requires 1 honest participant out of N
- 50+ participants provides strong statistical assurance
- Following established precedent (Zcash Sapling: 90 participants)
- Setup script automates the process for ceremony organizers

## Requirements
- Geographic diversity of participants
- Independent hardware/software environments
- Time-locked contributions
- All contributions publicly verifiable
- Ceremony transcript published

## Development Exception
For development and testing, a single-party setup is acceptable. The `scripts/setup-circuits.sh` script handles this. **Never use dev setup in production.**
