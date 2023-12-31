import algosdk from 'algosdk';
import { AlgoAmount } from './amount';
import { ABIAppCallArgs, ABIReturn, AppCallArgs, AppCallTransactionResult, AppCallType, AppCompilationResult, AppLookup, AppMetadata, AppReference, AppState, BoxName, OnSchemaBreak, OnUpdate, RawAppCallArgs, TealTemplateParams } from './app';
import { AppSpec } from './app-spec';
import { SendTransactionFrom, SendTransactionParams, TransactionNote } from './transaction';
import ABIMethod = algosdk.ABIMethod;
import ABIMethodParams = algosdk.ABIMethodParams;
import ABIType = algosdk.ABIType;
import ABIValue = algosdk.ABIValue;
import Algodv2 = algosdk.Algodv2;
import Indexer = algosdk.Indexer;
import OnApplicationComplete = algosdk.OnApplicationComplete;
import SuggestedParams = algosdk.SuggestedParams;
/** Configuration to resolve app by creator and name `getCreatorAppsByName` */
export type ResolveAppByCreatorAndNameBase = {
    /** The address of the app creator account to resolve the app by */
    creatorAddress: string;
    /** The optional name override to resolve the app by within the creator account (default: uses the name in the ABI contract) */
    name?: string;
    /** The mechanism to find an existing app instance metadata for the given creator and name; either:
     *  * An indexer instance to search the creator account apps; or
     *  * The cached value of the existing apps for the given creator from `getCreatorAppsByName`
     */
    findExistingUsing: Indexer | AppLookup;
};
/** Configuration to resolve app by creator and name `getCreatorAppsByName` */
export type ResolveAppByCreatorAndName = ResolveAppByCreatorAndNameBase & {
    /** How the app ID is resolved, either by `'id'` or `'creatorAndName'`; must be `'creatorAndName'` if you want to use `deploy` */
    resolveBy: 'creatorAndName';
};
/** Configuration to resolve app by ID */
export interface ResolveAppByIdBase {
    /** The id of an existing app to call using this client, or 0 if the app hasn't been created yet */
    id: number | bigint;
    /** The optional name to use to mark the app when deploying `ApplicationClient.deploy` (default: uses the name in the ABI contract) */
    name?: string;
}
export interface ResolveAppById extends ResolveAppByIdBase {
    /** How the app ID is resolved, either by `'id'` or `'creatorAndName'`; must be `'creatorAndName'` if you want to use `deploy` */
    resolveBy: 'id';
}
/** The details of an AlgoKit Utils deployed app */
export type AppDetailsBase = {
    /** Default sender to use for transactions issued by this application client */
    sender?: SendTransactionFrom;
    /** Default suggested params object to use */
    params?: SuggestedParams;
    /** Optionally provide any deploy-time parameters to replace in the TEAL code; if specified here will get
     * used in calls to `deploy`, `create` and `update` unless overridden in those calls
     */
    deployTimeParams?: TealTemplateParams;
};
/** The details of an AlgoKit Utils deployed app */
export type AppDetails = AppDetailsBase & (ResolveAppById | ResolveAppByCreatorAndName);
/** The details of an ARC-0032 app spec specified, AlgoKit Utils deployed app */
export type AppSpecAppDetailsBase = {
    /** The ARC-0032 application spec as either:
     *  * Parsed JSON `AppSpec`
     *  * Raw JSON string
     */
    app: AppSpec | string;
};
/** The details of an ARC-0032 app spec specified, AlgoKit Utils deployed app by id*/
export type AppSpecAppDetailsById = AppSpecAppDetailsBase & AppDetailsBase & ResolveAppByIdBase;
/** The details of an ARC-0032 app spec specified, AlgoKit Utils deployed app by creator and name*/
export type AppSpecAppDetailsByCreatorAndName = AppSpecAppDetailsBase & AppDetailsBase & ResolveAppByCreatorAndNameBase;
/** The details of an ARC-0032 app spec specified, AlgoKit Utils deployed app */
export type AppSpecAppDetails = AppSpecAppDetailsBase & AppDetails;
/** Core parameters to pass into ApplicationClient.deploy */
export interface AppClientDeployCoreParams {
    /** The version of the contract, uses "1.0" by default */
    version?: string;
    /** The optional sender to send the transaction from, will use the application client's default sender by default if specified */
    sender?: SendTransactionFrom;
    /** Parameters to control transaction sending */
    sendParams?: Omit<SendTransactionParams, 'skipSending' | 'skipWaiting'>;
    /** Whether or not to allow updates in the contract using the deploy-time updatability control if present in your contract.
     * If this is not specified then it will automatically be determined based on the AppSpec definition
     **/
    allowUpdate?: boolean;
    /** Whether or not to allow deletes in the contract using the deploy-time deletability control if present in your contract.
     * If this is not specified then it will automatically be determined based on the AppSpec definition
     **/
    allowDelete?: boolean;
    /** What action to perform if a schema break is detected */
    onSchemaBreak?: 'replace' | 'fail' | 'append' | OnSchemaBreak;
    /** What action to perform if a TEAL update is detected */
    onUpdate?: 'update' | 'replace' | 'append' | 'fail' | OnUpdate;
}
/** Call interface parameters to pass into ApplicationClient.deploy */
export interface AppClientDeployCallInterfaceParams {
    /** Any deploy-time parameters to replace in the TEAL code */
    deployTimeParams?: TealTemplateParams;
    /** Any args to pass to any create transaction that is issued as part of deployment */
    createArgs?: AppClientCallArgs;
    /** Override the on-completion action for the create call; defaults to NoOp */
    createOnCompleteAction?: Exclude<AppCallType, 'clear_state'> | Exclude<OnApplicationComplete, OnApplicationComplete.ClearStateOC>;
    /** Any args to pass to any update transaction that is issued as part of deployment */
    updateArgs?: AppClientCallArgs;
    /** Any args to pass to any delete transaction that is issued as part of deployment */
    deleteArgs?: AppClientCallArgs;
}
/** Parameters to pass into ApplicationClient.deploy */
export interface AppClientDeployParams extends AppClientDeployCoreParams, AppClientDeployCallInterfaceParams {
}
export interface AppClientCallRawArgs extends RawAppCallArgs {
}
export interface AppClientCallABIArgs extends Omit<ABIAppCallArgs, 'method'> {
    /** If calling an ABI method then either the name of the method, or the ABI signature */
    method: string;
}
/** The arguments to pass to an Application Client smart contract call */
export type AppClientCallArgs = AppClientCallRawArgs | AppClientCallABIArgs;
/** Common (core) parameters to construct a ApplicationClient contract call */
export interface AppClientCallCoreParams {
    /** The optional sender to send the transaction from, will use the application client's default sender by default if specified */
    sender?: SendTransactionFrom;
    /** The transaction note for the smart contract call */
    note?: TransactionNote;
    /** Parameters to control transaction sending */
    sendParams?: SendTransactionParams;
}
/** Parameters to construct a ApplicationClient contract call */
export type AppClientCallParams = AppClientCallArgs & AppClientCallCoreParams;
/** Parameters to construct a ApplicationClient clear state contract call */
export type AppClientClearStateParams = AppClientCallRawArgs & AppClientCallCoreParams;
export interface AppClientCompilationParams {
    /** Any deploy-time parameters to replace in the TEAL code */
    deployTimeParams?: TealTemplateParams;
    updatable?: boolean;
    deletable?: boolean;
}
/** On-complete action parameter for creating a contract using ApplicationClient */
export type AppClientCreateOnComplete = {
    /** Override the on-completion action for the create call; defaults to NoOp */
    onCompleteAction?: Exclude<AppCallType, 'clear_state'> | Exclude<OnApplicationComplete, OnApplicationComplete.ClearStateOC>;
};
/** Parameters for creating a contract using ApplicationClient */
export type AppClientCreateParams = AppClientCallParams & AppClientCompilationParams & AppClientCreateOnComplete;
/** Parameters for updating a contract using ApplicationClient */
export type AppClientUpdateParams = AppClientCallParams & AppClientCompilationParams;
/** Parameters for funding an app account */
export interface FundAppAccountParams {
    amount: AlgoAmount;
    /** The optional sender to send the transaction from, will use the application client's default sender by default if specified */
    sender?: SendTransactionFrom;
    /** The transaction note for the smart contract call */
    note?: TransactionNote;
    /** Parameters to control transaction sending */
    sendParams?: SendTransactionParams;
}
/** Source maps for an Algorand app */
export interface AppSourceMaps {
    /** The source map of the approval program */
    approvalSourceMap: SourceMapExport;
    /** The source map of the clear program */
    clearSourceMap: SourceMapExport;
}
export interface SourceMapExport {
    version: number;
    sources: string[];
    names: string[];
    mappings: string;
}
/** Application client - a class that wraps an ARC-0032 app spec and provides high productivity methods to deploy and call the app */
export declare class ApplicationClient {
    private algod;
    private indexer?;
    private appSpec;
    private sender;
    private params;
    private existingDeployments;
    private deployTimeParams?;
    private _appId;
    private _appAddress;
    private _creator;
    private _appName;
    private _approvalSourceMap;
    private _clearSourceMap;
    /**
     * Create a new ApplicationClient instance
     * @param appDetails The details of the app
     * @param algod An algod instance
     */
    constructor(appDetails: AppSpecAppDetails, algod: Algodv2);
    /**
     * Compiles the approval and clear programs and sets up the source map.
     * @param compilation The deploy-time parameters for the compilation
     * @returns The compiled approval and clear programs
     */
    compile(compilation?: AppClientCompilationParams): Promise<{
        approvalCompiled: import("./app").CompiledTeal;
        clearCompiled: import("./app").CompiledTeal;
    }>;
    /**
     * Export the current source maps for the app.
     * @returns The source maps
     */
    exportSourceMaps(): AppSourceMaps;
    /**
     * Import source maps for the app.
     * @param sourceMaps The source maps to import
     */
    importSourceMaps(sourceMaps: AppSourceMaps): void;
    /**
     * Idempotently deploy (create, update/delete if changed) an app against the given name via the given creator account, including deploy-time template placeholder substitutions.
     *
     * To understand the architecture decisions behind this functionality please see https://github.com/algorandfoundation/algokit-cli/blob/main/docs/architecture-decisions/2023-01-12_smart-contract-deployment.md
     *
     * **Note:** if there is a breaking state schema change to an existing app (and `onSchemaBreak` is set to `'replace'`) the existing app will be deleted and re-created.
     *
     * **Note:** if there is an update (different TEAL code) to an existing app (and `onUpdate` is set to `'replace'`) the existing app will be deleted and re-created.
     * @param deploy Deployment details
     * @returns The metadata and transaction result(s) of the deployment, or just the metadata if it didn't need to issue transactions
     */
    deploy(deploy?: AppClientDeployParams): Promise<(Partial<AppCompilationResult> & AppMetadata & {
        operationPerformed: "nothing";
    }) | {
        compiledApproval: import("./app").CompiledTeal;
        compiledClear: import("./app").CompiledTeal;
        confirmation: algosdk.modelsv2.PendingTransactionResponse;
        confirmations: algosdk.modelsv2.PendingTransactionResponse[];
        transaction: algosdk.Transaction;
        transactions: algosdk.Transaction[];
        createdRound: number;
        updatedRound: number;
        createdMetadata: import("./app").AppDeployMetadata;
        deleted: boolean;
        appId: number | bigint;
        appAddress: string;
        name: string;
        version: string;
        deletable?: boolean | undefined;
        updatable?: boolean | undefined;
        return?: ABIReturn | undefined;
        operationPerformed: "update" | "create";
    } | {
        compiledApproval: import("./app").CompiledTeal;
        compiledClear: import("./app").CompiledTeal;
        confirmation: algosdk.modelsv2.PendingTransactionResponse;
        confirmations: algosdk.modelsv2.PendingTransactionResponse[];
        transaction: algosdk.Transaction;
        transactions: algosdk.Transaction[];
        createdRound: number;
        updatedRound: number;
        createdMetadata: import("./app").AppDeployMetadata;
        deleted: boolean;
        appId: number | bigint;
        appAddress: string;
        name: string;
        version: string;
        deletable?: boolean | undefined;
        updatable?: boolean | undefined;
        return?: ABIReturn | undefined;
        deleteReturn?: ABIReturn | undefined;
        deleteResult: import("./transaction").ConfirmedTransactionResult;
        operationPerformed: "replace";
    }>;
    /**
     * Creates a smart contract app, returns the details of the created app.
     * @param create The parameters to create the app with
     * @returns The details of the created app, or the transaction to create it if `skipSending` and the compilation result
     */
    create(create?: AppClientCreateParams): Promise<{
        compiledApproval: import("./app").CompiledTeal;
        compiledClear: import("./app").CompiledTeal;
        return?: ABIReturn | undefined;
        transactions: algosdk.Transaction[];
        confirmations?: algosdk.modelsv2.PendingTransactionResponse[] | undefined;
        transaction: algosdk.Transaction;
        confirmation?: algosdk.modelsv2.PendingTransactionResponse | undefined;
        appId: number | bigint;
        appAddress: string;
    }>;
    /**
     * Updates the smart contract app.
     * @param update The parameters to update the app with
     * @returns The transaction send result and the compilation result
     */
    update(update?: AppClientUpdateParams): Promise<{
        compiledApproval: import("./app").CompiledTeal;
        compiledClear: import("./app").CompiledTeal;
        return?: ABIReturn | undefined;
        transactions: algosdk.Transaction[];
        confirmations?: algosdk.modelsv2.PendingTransactionResponse[] | undefined;
        transaction: algosdk.Transaction;
        confirmation?: algosdk.modelsv2.PendingTransactionResponse | undefined;
    }>;
    /**
     * Issues a no_op (normal) call to the app.
     * @param call The call details.
     * @returns The result of the call
     */
    call(call?: AppClientCallParams): Promise<AppCallTransactionResult>;
    /**
     * Issues a opt_in call to the app.
     * @param call The call details.
     * @returns The result of the call
     */
    optIn(call?: AppClientCallParams): Promise<AppCallTransactionResult>;
    /**
     * Issues a close_out call to the app.
     * @param call The call details.
     * @returns The result of the call
     */
    closeOut(call?: AppClientCallParams): Promise<AppCallTransactionResult>;
    /**
     * Issues a clear_state call to the app.
     * @param call The call details.
     * @returns The result of the call
     */
    clearState(call?: AppClientClearStateParams): Promise<AppCallTransactionResult>;
    /**
     * Issues a delete_application call to the app.
     * @param call The call details.
     * @returns The result of the call
     */
    delete(call?: AppClientCallParams): Promise<AppCallTransactionResult>;
    /**
     * Issues a call to the app with the given call type.
     * @param call The call details.
     * @param callType The call type
     * @returns The result of the call
     */
    callOfType(call: AppClientCallParams | undefined, callType: Exclude<AppCallType, 'update_application'> | Exclude<OnApplicationComplete, OnApplicationComplete.UpdateApplicationOC>): Promise<AppCallTransactionResult>;
    /**
     * Funds ALGOs into the app account for this app.
     * @param fund The parameters for the funding or the funding amount
     * @returns The result of the funding
     */
    fundAppAccount(fund: FundAppAccountParams | AlgoAmount): Promise<import("./transaction").SendTransactionResult>;
    /**
     * Returns global state for the current app.
     * @returns The global state
     */
    getGlobalState(): Promise<AppState>;
    /**
     * Returns local state for the given account / account address.
     * @returns The global state
     */
    getLocalState(account: string | SendTransactionFrom): Promise<AppState>;
    /**
     * Returns the names of all current boxes for the current app.
     * @returns The names of the boxes
     */
    getBoxNames(): Promise<BoxName[]>;
    /**
     * Returns the value of the given box for the current app.
     * @param name The name of the box to return either as a string, binary array or `BoxName`
     * @returns The current box value as a byte array
     */
    getBoxValue(name: BoxName | string | Uint8Array): Promise<Uint8Array>;
    /**
     * Returns the value of the given box for the current app.
     * @param name The name of the box to return either as a string, binary array or `BoxName`
     * @param type
     * @returns The current box value as a byte array
     */
    getBoxValueFromABIType(name: BoxName | string | Uint8Array, type: ABIType): Promise<ABIValue>;
    /**
     * Returns the values of all current boxes for the current app.
     * Note: This will issue multiple HTTP requests (one per box) and it's not an atomic operation so values may be out of sync.
     * @param filter Optional filter to filter which boxes' values are returned
     * @returns The (name, value) pair of the boxes with values as raw byte arrays
     */
    getBoxValues(filter?: (name: BoxName) => boolean): Promise<{
        name: BoxName;
        value: Uint8Array;
    }[]>;
    /**
     * Returns the values of all current boxes for the current app decoded using an ABI Type.
     * Note: This will issue multiple HTTP requests (one per box) and it's not an atomic operation so values may be out of sync.
     * @param type The ABI type to decode the values with
     * @param filter Optional filter to filter which boxes' values are returned
     * @returns The (name, value) pair of the boxes with values as the ABI Value
     */
    getBoxValuesFromABIType(type: ABIType, filter?: (name: BoxName) => boolean): Promise<{
        name: BoxName;
        value: ABIValue;
    }[]>;
    /**
     * Returns the arguments for an app call for the given ABI method or raw method specification.
     * @param args The call args specific to this application client
     * @param sender The sender of this call. Will be used to fetch any default argument values if applicable
     * @returns The call args ready to pass into an app call
     */
    getCallArgs(args: AppClientCallArgs | undefined, sender: SendTransactionFrom): Promise<AppCallArgs | undefined>;
    /**
     * Returns the ABI Method parameters for the given method name string for the app represented by this application client instance
     * @param method Either the name of the method or the ABI method spec definition string
     * @returns The ABI method params for the given method
     */
    getABIMethodParams(method: string): ABIMethodParams | undefined;
    /**
     * Returns the ABI Method for the given method name string for the app represented by this application client instance
     * @param method Either the name of the method or the ABI method spec definition string
     * @returns The ABI method for the given method
     */
    getABIMethod(method: string): ABIMethod | undefined;
    /**
     * Gets the reference information for the current application instance.
     * `appId` will be 0 if it can't find an app.
     * @returns The app reference, or if deployed using the `deploy` method, the app metadata too
     */
    getAppReference(): Promise<AppMetadata | AppReference>;
    /**
     * Takes an error that may include a logic error from a smart contract call and re-exposes the error to include source code information via the source map.
     * This is automatically used within `ApplicationClient` but if you pass `skipSending: true` e.g. if doing a group transaction
     *  then you can use this in a try/catch block to get better debugging information.
     * @param e The error to parse
     * @param isClear Whether or not the code was running the clear state program
     * @returns The new error, or if there was no logic error or source map then the wrapped error with source details
     */
    exposeLogicError(e: Error, isClear?: boolean): Error;
}
//# sourceMappingURL=app-client.d.ts.map