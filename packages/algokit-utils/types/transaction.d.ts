import algosdk from 'algosdk';
import { AlgoAmount } from './types/amount';
import { AtomicTransactionComposerToSend, SendAtomicTransactionComposerResults, SendTransactionFrom, SendTransactionParams, SendTransactionResult, TransactionGroupToSend, TransactionNote, TransactionToSign } from './types/transaction';
import Algodv2 = algosdk.Algodv2;
import AtomicTransactionComposer = algosdk.AtomicTransactionComposer;
import modelsv2 = algosdk.modelsv2;
import SuggestedParams = algosdk.SuggestedParams;
import Transaction = algosdk.Transaction;
import TransactionWithSigner = algosdk.TransactionWithSigner;
export declare const MAX_TRANSACTION_GROUP_SIZE = 16;
/** Encodes a transaction note into a byte array ready to be included in an Algorand transaction.
 *
 * @param note The transaction note
 * @returns the transaction note ready for inclusion in a transaction
 *
 *  Case on the value of `data` this either be:
 *   * `null` | `undefined`: `undefined`
 *   * `string`: The string value
 *   * Uint8Array: passthrough
 *   * Arc2TransactionNote object: ARC-0002 compatible transaction note
 *   * Else: The object/value converted into a JSON string representation
 */
export declare function encodeTransactionNote(note?: TransactionNote): Uint8Array | undefined;
/** Encodes a transaction lease into a 32-byte array ready to be included in an Algorand transaction.
 *
 * @param lease The transaction lease as a string or binary array or null/undefined if there is no lease
 * @returns the transaction lease ready for inclusion in a transaction or `undefined` if there is no lease
 * @throws if the length of the data is > 32 bytes or empty
 * @example algokit.encodeLease('UNIQUE_ID')
 * @example algokit.encodeLease(new Uint8Array([1, 2, 3]))
 */
export declare function encodeLease(lease?: string | Uint8Array): Uint8Array | undefined;
/**
 * Returns the public address of the given transaction sender.
 * @param sender A transaction sender
 * @returns The public address
 */
export declare const getSenderAddress: (sender: string | SendTransactionFrom) => string;
/**
 * Given a transaction in a variety of supported formats, returns a TransactionWithSigner object ready to be passed to an
 * AtomicTransactionComposer's addTransaction method.
 * @param transaction One of: A TransactionWithSigner object (returned as is), a TransactionToSign object (signer is obtained from the
 * signer property), a Transaction object (signer is extracted from the defaultSender parameter), an async SendTransactionResult returned by
 * one of algokit utils' helpers (signer is obtained from the defaultSender parameter)
 * @param defaultSender The default sender to be used to obtain a signer where the object provided to the transaction parameter does not
 * include a signer.
 * @returns A TransactionWithSigner object.
 */
export declare const getTransactionWithSigner: (transaction: TransactionWithSigner | TransactionToSign | Transaction | Promise<SendTransactionResult>, defaultSender?: SendTransactionFrom) => Promise<TransactionWithSigner>;
/**
 * Returns a `TransactionSigner` for the given transaction sender.
 * This function has memoization, so will return the same transaction signer for a given sender.
 * @param sender A transaction sender
 * @returns A transaction signer
 */
export declare const getSenderTransactionSigner: (val: SendTransactionFrom) => algosdk.TransactionSigner;
/**
 * Signs a single transaction by the given signer.
 * @param transaction The transaction to sign
 * @param signer The signer to sign
 * @returns The signed transaction as a `Uint8Array`
 */
export declare const signTransaction: (transaction: Transaction, signer: SendTransactionFrom) => Promise<Uint8Array>;
/** Prepares a transaction for sending and then (if instructed) signs and sends the given transaction to the chain.
 *
 * @param send The details for the transaction to prepare/send, including:
 *   * `transaction`: The unsigned transaction
 *   * `from`: The account to sign the transaction with: either an account with private key loaded or a logic signature account
 *   * `config`: The sending configuration for this transaction
 * @param algod An algod client
 *
 * @returns An object with transaction (`transaction`) and (if `skipWaiting` is `false` or `undefined`) confirmation (`confirmation`)
 */
export declare const sendTransaction: (send: {
    transaction: Transaction;
    from: SendTransactionFrom;
    sendParams?: SendTransactionParams;
}, algod: Algodv2) => Promise<SendTransactionResult>;
/**
 * Signs and sends transactions that have been collected by an `AtomicTransactionComposer`.
 * @param atcSend The parameters controlling the send, including:
 *  * `atc` The `AtomicTransactionComposer`
 *  * `sendParams` The parameters to control the send behaviour
 * @param algod An algod client
 * @returns An object with transaction IDs, transactions, group transaction ID (`groupTransactionId`) if more than 1 transaction sent, and (if `skipWaiting` is `false` or unset) confirmation (`confirmation`)
 */
export declare const sendAtomicTransactionComposer: (atcSend: AtomicTransactionComposerToSend, algod: Algodv2) => Promise<SendAtomicTransactionComposerResults>;
/**
 * Performs a dry run of the transactions loaded into the given AtomicTransactionComposer`
 * @param atc The AtomicTransactionComposer` with transaction(s) loaded
 * @param algod An Algod client
 * @returns The dryrun result
 */
export declare function performAtomicTransactionComposerDryrun(atc: AtomicTransactionComposer, algod: Algodv2): Promise<algosdk.DryrunResult>;
/**
 * Performs a simulation of the transactions loaded into the given AtomicTransactionComposer.
 * @param atc The AtomicTransactionComposer with transaction(s) loaded.
 * @param algod An Algod client to perform the simulation.
 * @returns The simulation result, which includes various details about how the transactions would be processed.
 */
export declare function performAtomicTransactionComposerSimulate(atc: AtomicTransactionComposer, algod: Algodv2): Promise<algosdk.modelsv2.SimulateResponse>;
/**
 * Signs and sends a group of [up to 16](https://developer.algorand.org/docs/get-details/atomic_transfers/#create-transactions) transactions to the chain
 *
 * @param groupSend The group details to send, with:
 *   * `transactions`: The array of transactions to send along with their signing account
 *   * `sendParams`: The parameters to dictate how the group is sent
 * @param algod An algod client
 * @returns An object with transaction IDs, transactions, group transaction ID (`groupTransactionId`) if more than 1 transaction sent, and (if `skipWaiting` is `false` or unset) confirmation (`confirmation`)
 */
export declare const sendGroupOfTransactions: (groupSend: TransactionGroupToSend, algod: Algodv2) => Promise<Omit<SendAtomicTransactionComposerResults, "returns">>;
/**
 * Wait until the transaction is confirmed or rejected, or until `timeout`
 * number of rounds have passed.
 *
 * @param algod An algod client
 * @param transactionId The transaction ID to wait for
 * @param maxRoundsToWait Maximum number of rounds to wait
 *
 * @return Pending transaction information
 * @throws Throws an error if the transaction is not confirmed or rejected in the next `timeout` rounds
 */
export declare const waitForConfirmation: (transactionId: string, maxRoundsToWait: number | bigint, algod: Algodv2) => Promise<modelsv2.PendingTransactionResponse>;
/**
 * Limit the acceptable fee to a defined amount of µALGOs.
 * This also sets the transaction to be flatFee to ensure the transaction only succeeds at
 * the estimated rate.
 * @param transaction The transaction to cap or suggested params object about to be used to create a transaction
 * @param maxAcceptableFee The maximum acceptable fee to pay
 */
export declare function capTransactionFee(transaction: algosdk.Transaction | SuggestedParams, maxAcceptableFee: AlgoAmount): void;
/**
 * Allows for control of fees on a `Transaction` or `SuggestedParams` object
 * @param transaction The transaction or suggested params
 * @param feeControl The fee control parameters
 */
export declare function controlFees<T extends SuggestedParams | Transaction>(transaction: T, feeControl: {
    fee?: AlgoAmount;
    maxFee?: AlgoAmount;
}): T;
/**
 * Returns suggested transaction parameters from algod unless some are already provided.
 * @param params Optionally provide parameters to use
 * @param algod Algod algod
 * @returns The suggested transaction parameters
 */
export declare function getTransactionParams(params: SuggestedParams | undefined, algod: Algodv2): Promise<import("algosdk/dist/types/types/transactions/base").SuggestedParamsWithMinFee | {
    flatFee?: boolean | undefined;
    fee: number;
    firstRound: number;
    lastRound: number;
    genesisID: string;
    genesisHash: string;
}>;
/**
 * Returns the array of transactions currently present in the given `AtomicTransactionComposer`
 * @param atc The atomic transaction composer
 * @returns The array of transactions with signers
 */
export declare function getAtomicTransactionComposerTransactions(atc: AtomicTransactionComposer): algosdk.TransactionWithSigner[];
//# sourceMappingURL=transaction.d.ts.map