/**
 * Runs the given indexer call until a 404 error is no longer returned.
 * Tried every 200ms up to 100 times.
 * Very rudimentary implementation designed for automated testing.
 * @example
 * ```typescript
 * const transaction = await runWhenIndexerCaughtUp(() => indexer.lookupTransactionByID(txnId).do())
 * ```
 * @param run The code to run
 * @returns The result (as a promise), or throws if the indexer didn't catch up in time
 */
export declare function runWhenIndexerCaughtUp<T>(run: () => Promise<T>): Promise<T>;
//# sourceMappingURL=indexer.d.ts.map