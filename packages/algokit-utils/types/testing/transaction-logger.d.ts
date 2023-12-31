import algosdk from 'algosdk';
import Algodv2 = algosdk.Algodv2;
import Indexer = algosdk.Indexer;
/**
 * Allows you to keep track of Algorand transaction IDs by wrapping an `Algodv2` in a proxy.
 * Useful for automated tests.
 */
export declare class TransactionLogger {
    private _sentTransactionIds;
    /**
     * The list of transaction IDs that has been logged thus far.
     */
    get sentTransactionIds(): Readonly<string[]>;
    /**
     * Clear all logged IDs.
     */
    clear(): void;
    /**
     * The method that captures raw transactions and stores the transaction IDs.
     */
    logRawTransaction(signedTransactions: Uint8Array | Uint8Array[]): void;
    /** Return a proxy that wraps the given Algodv2 with this transaction logger.
     *
     * @param algod The `Algodv2` to wrap
     * @returns The wrapped `Algodv2`, any transactions sent using this algod instance will be logged by this transaction logger
     */
    capture(algod: Algodv2): Algodv2;
    /** Wait until all logged transactions IDs appear in the given `Indexer`. */
    waitForIndexer(indexer: Indexer): Promise<void>;
}
//# sourceMappingURL=transaction-logger.d.ts.map