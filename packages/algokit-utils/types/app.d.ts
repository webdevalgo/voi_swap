import algosdk from 'algosdk';
import { ABIAppCallArgs, ABIReturn, AppCallArgs, AppCallParams, AppCallTransactionResult, AppCallType, AppCompilationResult, AppReference, AppState, BoxIdentifier, BoxName, BoxReference, BoxValueRequestParams, BoxValuesRequestParams, CompiledTeal, CreateAppParams, RawAppCallArgs, UpdateAppParams } from './types/app';
import { SendTransactionFrom } from './types/transaction';
import ABIMethod = algosdk.ABIMethod;
import ABIMethodParams = algosdk.ABIMethodParams;
import ABIValue = algosdk.ABIValue;
import Algodv2 = algosdk.Algodv2;
import modelsv2 = algosdk.modelsv2;
import OnApplicationComplete = algosdk.OnApplicationComplete;
/**
 * Creates a smart contract app, returns the details of the created app.
 * @param create The parameters to create the app with
 * @param algod An algod client
 * @returns The details of the created app, or the transaction to create it if `skipSending` and the compilation result
 */
export declare function createApp(create: CreateAppParams, algod: Algodv2): Promise<Partial<AppCompilationResult> & AppCallTransactionResult & AppReference>;
/**
 * Updates a smart contract app.
 * @param update The parameters to update the app with
 * @param algod An algod client
 * @returns The transaction send result and the compilation result
 */
export declare function updateApp(update: UpdateAppParams, algod: Algodv2): Promise<Partial<AppCompilationResult> & AppCallTransactionResult>;
/** Returns an `algosdk.OnApplicationComplete` for the given onCompleteAction.
 *
 * If given `undefined` will return `OnApplicationComplete.NoOpOC`.
 *
 * If given an `AppCallType` will convert the string enum to the correct underlying `algosdk.OnApplicationComplete`.
 *
 * @param onCompletionAction The on completion action
 * @returns The `algosdk.OnApplicationComplete`
 */
export declare function getAppOnCompleteAction(onCompletionAction?: AppCallType | OnApplicationComplete): algosdk.OnApplicationComplete;
/**
 * Issues a call to a given app.
 * @param call The call details.
 * @param algod An algod client
 * @returns The result of the call
 */
export declare function callApp(call: AppCallParams, algod: Algodv2): Promise<AppCallTransactionResult>;
/**
 * Returns any ABI return values for the given app call arguments and transaction confirmation.
 * @param args The arguments that were used for the call
 * @param confirmation The transaction confirmation from algod
 * @returns The return value for the method call
 */
export declare function getABIReturn(args?: AppCallArgs, confirmation?: modelsv2.PendingTransactionResponse): ABIReturn | undefined;
/**
 * Returns the current global state values for the given app ID
 * @param appId The ID of the app return global state for
 * @param algod An algod client instance
 * @returns The current global state
 */
export declare function getAppGlobalState(appId: number | bigint, algod: Algodv2): Promise<AppState>;
/**
 * Returns the current global state values for the given app ID and account
 * @param appId The ID of the app return global state for
 * @param account Either the string address of an account or an account object for the account to get local state for the given app
 * @param algod An algod client instance
 * @returns The current local state for the given (app, account) combination
 */
export declare function getAppLocalState(appId: number | bigint, account: string | SendTransactionFrom, algod: Algodv2): Promise<AppState>;
/**
 * Returns the names of the boxes for the given app.
 * @param appId The ID of the app return box names for
 * @param algod An algod client instance
 * @returns The current box names
 */
export declare function getAppBoxNames(appId: number | bigint, algod: Algodv2): Promise<BoxName[]>;
/**
 * Returns the value of the given box name for the given app.
 * @param appId The ID of the app return box names for
 * @param boxName The name of the box to return either as a string, binary array or `BoxName`
 * @param algod An algod client instance
 * @returns The current box value as a byte array
 */
export declare function getAppBoxValue(appId: number | bigint, boxName: string | Uint8Array | BoxName, algod: Algodv2): Promise<Uint8Array>;
/**
 * Returns the value of the given box names for the given app.
 * @param appId The ID of the app return box names for
 * @param boxNames The names of the boxes to return either as a string, binary array or `BoxName`
 * @param algod An algod client instance
 * @returns The current box values as a byte array in the same order as the passed in box names
 */
export declare function getAppBoxValues(appId: number, boxNames: (string | Uint8Array | BoxName)[], algod: Algodv2): Promise<Uint8Array[]>;
/**
 * Returns the value of the given box name for the given app decoded based on the given ABI type.
 * @param request The parameters for the box value request
 * @param algod An algod client instance
 * @returns The current box value as an ABI value
 */
export declare function getAppBoxValueFromABIType(request: BoxValueRequestParams, algod: Algodv2): Promise<ABIValue>;
/**
 * Returns the value of the given box names for the given app decoded based on the given ABI type.
 * @param request The parameters for the box value request
 * @param algod An algod client instance
 * @returns The current box values as an ABI value in the same order as the passed in box names
 */
export declare function getAppBoxValuesFromABIType(request: BoxValuesRequestParams, algod: Algodv2): Promise<ABIValue[]>;
/**
 * Converts an array of global/local state values from the algod api to a more friendly
 * generic object keyed by the UTF-8 value of the key.
 * @param state A `global-state`, `local-state`, `global-state-deltas` or `local-state-deltas`
 * @returns An object keyeed by the UTF-8 representation of the key with various parsings of the values
 */
export declare function decodeAppState(state: {
    key: string;
    value: modelsv2.TealValue | modelsv2.EvalDelta;
}[]): AppState;
/**
 * Returns the app args ready to load onto an app `Transaction` object
 * @param args The app call args
 * @returns The args ready to load into a `Transaction`
 */
export declare function getAppArgsForTransaction(args?: RawAppCallArgs): {
    accounts: string[] | undefined;
    appArgs: Uint8Array[] | undefined;
    boxes: algosdk.BoxReference[] | undefined;
    foreignApps: number[] | undefined;
    foreignAssets: number[] | undefined;
    lease: Uint8Array | undefined;
} | undefined;
/**
 * Returns the app args ready to load onto an ABI method call in `AtomicTransactionComposer`
 * @param args The ABI app call args
 * @param from The transaction signer
 * @returns The parameters ready to pass into `addMethodCall` within AtomicTransactionComposer
 */
export declare function getAppArgsForABICall(args: ABIAppCallArgs, from: SendTransactionFrom): Promise<{
    method: algosdk.ABIMethod;
    sender: string;
    signer: algosdk.TransactionSigner;
    boxes: algosdk.BoxReference[] | undefined;
    lease: Uint8Array | undefined;
    appForeignApps: number[] | undefined;
    appForeignAssets: number[] | undefined;
    appAccounts: string[] | undefined;
    methodArgs: (string | number | bigint | boolean | Uint8Array | algosdk.ABIValue[] | algosdk.TransactionWithSigner)[];
    rekeyTo: string | undefined;
}>;
/**
 * Returns a `algosdk.BoxReference` given a `BoxIdentifier` or `BoxReference`.
 * @param box The box to return a reference for
 * @returns The box reference ready to pass into a `Transaction`
 */
export declare function getBoxReference(box: BoxIdentifier | BoxReference | algosdk.BoxReference): algosdk.BoxReference;
/**
 * Gets the current data for the given app from algod.
 *
 * @param appId The id of the app
 * @param algod An algod client
 * @returns The data about the app
 */
export declare function getAppById(appId: number | bigint, algod: Algodv2): Promise<algosdk.modelsv2.Application>;
/**
 * Compiles the given TEAL using algod and returns the result, including source map.
 *
 * @param algod An algod client
 * @param tealCode The TEAL code
 * @returns The information about the compiled file
 */
export declare function compileTeal(tealCode: string, algod: Algodv2): Promise<CompiledTeal>;
/**
 * Returns the encoded ABI spec for a given ABI Method
 * @param method The method to return a signature for
 * @returns The encoded ABI method spec e.g. `method_name(uint64,string)string`
 */
export declare const getABIMethodSignature: (method: ABIMethodParams | ABIMethod) => string;
//# sourceMappingURL=app.d.ts.map