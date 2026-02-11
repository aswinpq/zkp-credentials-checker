#!/bin/bash
# Circuit Setup Script
# Compiles the Circom circuit, generates proving/verification keys
# using the Groth16 proving system and Powers of Tau ceremony.
#
# Prerequisites:
#   - circom (https://docs.circom.io/getting-started/installation/)
#   - snarkjs (npm install -g snarkjs)

set -euo pipefail

CIRCUIT_NAME="credential"
BUILD_DIR="./circuits/build"
SETUP_DIR="./circuits/setup/powers-of-tau"
CIRCUIT_PATH="./circuits/${CIRCUIT_NAME}.circom"

echo "=== ZK Credential Circuit Setup ==="

# Create directories
mkdir -p "$BUILD_DIR"
mkdir -p "$SETUP_DIR"

# Step 1: Compile the circuit
echo "[1/7] Compiling circuit..."
circom "$CIRCUIT_PATH" \
  --r1cs \
  --wasm \
  --sym \
  -o "$BUILD_DIR"

echo "  R1CS constraints: $(snarkjs r1cs info "${BUILD_DIR}/${CIRCUIT_NAME}.r1cs" | grep "Constraints")"

# Step 2: Powers of Tau ceremony (Phase 1)
echo "[2/7] Starting Powers of Tau ceremony..."
PTAU_FILE="${SETUP_DIR}/pot12_0000.ptau"
if [ ! -f "$PTAU_FILE" ]; then
  snarkjs powersoftau new bn128 12 "$PTAU_FILE" -v
fi

# Step 3: Contribute to ceremony
echo "[3/7] Contributing to ceremony..."
PTAU_CONTRIB="${SETUP_DIR}/pot12_0001.ptau"
snarkjs powersoftau contribute "$PTAU_FILE" "$PTAU_CONTRIB" \
  --name="First contribution" -v -e="random-entropy-$(date +%s)"

# Step 4: Prepare Phase 2
echo "[4/7] Preparing Phase 2..."
PTAU_FINAL="${SETUP_DIR}/pot12_final.ptau"
snarkjs powersoftau prepare phase2 "$PTAU_CONTRIB" "$PTAU_FINAL" -v

# Step 5: Generate zkey (Phase 2)
echo "[5/7] Generating proving key..."
ZKEY_INIT="${BUILD_DIR}/${CIRCUIT_NAME}_0000.zkey"
snarkjs groth16 setup "${BUILD_DIR}/${CIRCUIT_NAME}.r1cs" "$PTAU_FINAL" "$ZKEY_INIT"

# Step 6: Contribute to Phase 2
echo "[6/7] Contributing to Phase 2..."
ZKEY_FINAL="${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey"
snarkjs zkey contribute "$ZKEY_INIT" "$ZKEY_FINAL" \
  --name="First phase2 contribution" -v -e="phase2-entropy-$(date +%s)"

# Step 7: Export verification key
echo "[7/7] Exporting verification key..."
snarkjs zkey export verificationkey "$ZKEY_FINAL" "${BUILD_DIR}/verification_key.json"

# Verify the setup
echo ""
echo "=== Verifying Setup ==="
snarkjs zkey verify "${BUILD_DIR}/${CIRCUIT_NAME}.r1cs" "$PTAU_FINAL" "$ZKEY_FINAL"

echo ""
echo "=== Setup Complete ==="
echo "  WASM:             ${BUILD_DIR}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm"
echo "  Proving key:      ${ZKEY_FINAL}"
echo "  Verification key: ${BUILD_DIR}/verification_key.json"
echo ""
echo "IMPORTANT: For production, run a multi-party ceremony with 50+ participants."
