/**
 * Type declarations for snarkjs (no @types/snarkjs available).
 */
declare module 'snarkjs' {
    export interface Groth16Proof {
        pi_a: string[];
        pi_b: string[][];
        pi_c: string[];
        protocol: string;
        curve: string;
    }

    export namespace groth16 {
        function fullProve(
            input: Record<string, unknown>,
            wasmFile: string,
            zkeyFile: string,
        ): Promise<{ proof: Groth16Proof; publicSignals: string[] }>;

        function verify(
            vkey: Record<string, unknown>,
            publicSignals: string[],
            proof: Groth16Proof,
        ): Promise<boolean>;

        function exportSolidityCallData(
            proof: Groth16Proof,
            publicSignals: string[],
        ): Promise<string>;
    }

    export namespace zKey {
        function exportVerificationKey(zkeyFileName: string): Promise<Record<string, unknown>>;
    }

    export namespace wtns {
        function calculate(
            input: Record<string, unknown>,
            wasmFile: string,
            wtnsFileName: string,
        ): Promise<void>;
    }
}
