pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

template MerkleTreeInclusionProof(nLevels) {
    signal input leaf;
    signal input pathElements[nLevels];
    signal input pathIndices[nLevels];
    signal output root;

    component poseidons[nLevels];
    component mux[nLevels];

    signal currentHash[nLevels + 1];
    currentHash[0] <== leaf;

    for (var i = 0; i < nLevels; i++) {
        // Mux1 selects input order based on pathIndices[i]
        // if index 0: hash(current, pathElement)
        // if index 1: hash(pathElement, current)
        
        poseidons[i] = Poseidon(2);
        mux[i] = MultiMux1(2);

        mux[i].c[0][0] <== currentHash[i];
        mux[i].c[0][1] <== pathElements[i];

        mux[i].c[1][0] <== pathElements[i];
        mux[i].c[1][1] <== currentHash[i];

        mux[i].s <== pathIndices[i];

        poseidons[i].inputs[0] <== mux[i].out[0];
        poseidons[i].inputs[1] <== mux[i].out[1];

        currentHash[i + 1] <== poseidons[i].out;
    }

    root <== currentHash[nLevels];
}

template CredentialProof(nLevels) {
    signal input credential; // Represented as a field element
    signal input pathElements[nLevels];
    signal input pathIndices[nLevels];
    signal output root;

    // 1. Hash the credential to get the leaf
    component hasher = Poseidon(1);
    hasher.inputs[0] <== credential;
    signal leaf <== hasher.out;

    // 2. Compute Root
    component tree = MerkleTreeInclusionProof(nLevels);
    tree.leaf <== leaf;
    for (var i = 0; i < nLevels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    root <== tree.root;
}

component main = CredentialProof(20);
