import algosdk from 'algosdk';
import type SearchForTransactions from 'algosdk/dist/types/client/v2/indexer/searchForTransactions';
import { AccountLookupResult, ApplicationResult, TransactionLookupResult, TransactionSearchResults } from './types/indexer';
import Indexer = algosdk.Indexer;
/**
 * Looks up a transaction by ID using Indexer.
 * @param transactionId The ID of the transaction to look up
 * @param indexer An indexer client
 * @returns The result of the look-up
 */
export declare function lookupTransactionById(transactionId: string, indexer: Indexer): Promise<TransactionLookupResult>;
/**
 * Looks up an account by address using Indexer.
 * @param transactionId The address of the account to look up
 * @param indexer An indexer client
 * @returns The result of the look-up
 */
export declare function lookupAccountByAddress(accountAddress: string, indexer: Indexer): Promise<AccountLookupResult>;
/**
 * Looks up applications that were created by the given address.
 * @param indexer An indexer instance
 * @param address The address of the creator to look up
 * @param getAll Whether or not to include deleted applications
 * @param paginationLimit The number of records to return per paginated request, default 1000
 * @returns The list of application results
 */
export declare function lookupAccountCreatedApplicationByAddress(indexer: Indexer, address: string, getAll?: boolean | undefined, paginationLimit?: number): Promise<ApplicationResult[]>;
/**
 * Allows transactions to be searched for the given criteria.
 * @param indexer An indexer client
 * @param searchCriteria The criteria to search for
 * @param paginationLimit The number of records to return per paginated request, default 1000
 * @returns The search results
 */
export declare function searchTransactions(indexer: Indexer, searchCriteria: (s: SearchForTransactions) => SearchForTransactions, paginationLimit?: number): Promise<TransactionSearchResults>;
export declare function executePaginatedRequest<TResult, TRequest extends {
    do: () => Promise<any>;
}>(extractItems: (response: any) => TResult[], buildRequest: (nextToken?: string) => TRequest): Promise<TResult[]>;
//# sourceMappingURL=indexer-lookup.d.ts.map