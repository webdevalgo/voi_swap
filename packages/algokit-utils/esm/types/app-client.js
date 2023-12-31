import algosdk from 'algosdk';
import { Buffer } from 'buffer';
import { callApp, compileTeal, createApp, getABIMethodSignature, getAppBoxNames, getAppBoxValue, getAppBoxValueFromABIType, getAppGlobalState, getAppLocalState, updateApp, } from '../app.js';
import { deployApp, getCreatorAppsByName, performTemplateSubstitution, replaceDeployTimeControlParams } from '../app-deploy.js';
import { getSenderAddress } from '../transaction.js';
import { transferAlgos } from '../transfer.js';
import { DELETABLE_TEMPLATE_NAME, UPDATABLE_TEMPLATE_NAME, } from './app.js';
import { LogicError } from './logic-error.js';
var ABIMethod = algosdk.ABIMethod;
var AtomicTransactionComposer = algosdk.AtomicTransactionComposer;
var getApplicationAddress = algosdk.getApplicationAddress;
var Indexer = algosdk.Indexer;
var SourceMap = algosdk.SourceMap;
/**
 * Determines deploy time control (UPDATABLE, DELETABLE) value by inspecting application specification
 * @param approval TEAL Approval program, not the base64 version found on the appSpec
 * @param appSpec Application Specification
 * @param templateVariableName Template variable
 * @param callConfigKey Call config type
 * @returns true if applicable call config is found, false if not found or undefined if variable not present
 */
function getDeployTimeControl(approval, appSpec, templateVariableName, callConfigKey) {
    // variable not present, so unknown control value
    if (!approval.includes(templateVariableName))
        return undefined;
    // a bare call for specified CallConfig is present and configured
    const bareCallConfig = appSpec.bare_call_config[callConfigKey];
    if (!!bareCallConfig && bareCallConfig !== 'NEVER')
        return true;
    // an ABI call for specified CallConfig is present and configured
    return Object.values(appSpec.hints).some((h) => {
        const abiCallConfig = h.call_config[callConfigKey];
        return !!abiCallConfig && abiCallConfig !== 'NEVER';
    });
}
/** Application client - a class that wraps an ARC-0032 app spec and provides high productivity methods to deploy and call the app */
export class ApplicationClient {
    algod;
    indexer;
    appSpec;
    sender;
    params;
    existingDeployments;
    deployTimeParams;
    _appId;
    _appAddress;
    _creator;
    _appName;
    _approvalSourceMap;
    _clearSourceMap;
    // todo: process ABI args as needed to make them nicer to deal with like beaker-ts
    // todo: support readonly, noop method calls
    // todo: find create, update, delete, etc. methods from app spec and call them by default
    // todo: intelligent version management when deploying
    /**
     * Create a new ApplicationClient instance
     * @param appDetails The details of the app
     * @param algod An algod instance
     */
    constructor(appDetails, algod) {
        const { app, sender, params, deployTimeParams, ...appIdentifier } = appDetails;
        this.algod = algod;
        this.appSpec = typeof app == 'string' ? JSON.parse(app) : app;
        this._appName = appIdentifier.name ?? this.appSpec.contract.name;
        this.deployTimeParams = deployTimeParams;
        if (appIdentifier.resolveBy === 'id') {
            if (appIdentifier.id < 0) {
                throw new Error(`Attempt to create application client with invalid app id of ${appIdentifier.id}`);
            }
            this._appId = appIdentifier.id;
        }
        else {
            this._appId = 0;
            this._creator = appIdentifier.creatorAddress;
            if (appIdentifier.findExistingUsing instanceof Indexer) {
                this.indexer = appIdentifier.findExistingUsing;
            }
            else {
                if (appIdentifier.findExistingUsing.creator !== this._creator) {
                    throw new Error(`Attempt to create application client with invalid existingDeployments against a different creator (${appIdentifier.findExistingUsing.creator}) instead of expected creator ${this._creator}`);
                }
                this.existingDeployments = appIdentifier.findExistingUsing;
            }
        }
        this._appAddress = algosdk.getApplicationAddress(this._appId);
        this.sender = sender;
        this.params = params;
    }
    /**
     * Compiles the approval and clear programs and sets up the source map.
     * @param compilation The deploy-time parameters for the compilation
     * @returns The compiled approval and clear programs
     */
    async compile(compilation) {
        const { deployTimeParams, updatable, deletable } = compilation ?? {};
        const approvalTemplate = Buffer.from(this.appSpec.source.approval, 'base64').toString('utf-8');
        const approval = replaceDeployTimeControlParams(performTemplateSubstitution(approvalTemplate, deployTimeParams ?? this.deployTimeParams), {
            updatable,
            deletable,
        });
        const approvalCompiled = await compileTeal(approval, this.algod);
        this._approvalSourceMap = approvalCompiled?.sourceMap;
        const clearTemplate = Buffer.from(this.appSpec.source.clear, 'base64').toString('utf-8');
        const clear = performTemplateSubstitution(clearTemplate, deployTimeParams ?? this.deployTimeParams);
        const clearCompiled = await compileTeal(clear, this.algod);
        this._clearSourceMap = clearCompiled?.sourceMap;
        return { approvalCompiled, clearCompiled };
    }
    /**
     * Export the current source maps for the app.
     * @returns The source maps
     */
    exportSourceMaps() {
        if (!this._approvalSourceMap || !this._clearSourceMap) {
            throw new Error("Unable to export source maps; they haven't been loaded into this client - you need to call create, update, or deploy first");
        }
        return {
            approvalSourceMap: this._approvalSourceMap,
            clearSourceMap: this._clearSourceMap,
        };
    }
    /**
     * Import source maps for the app.
     * @param sourceMaps The source maps to import
     */
    importSourceMaps(sourceMaps) {
        this._approvalSourceMap = new SourceMap(sourceMaps.approvalSourceMap);
        this._clearSourceMap = new SourceMap(sourceMaps.clearSourceMap);
    }
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
    async deploy(deploy) {
        const { sender: deploySender, version, allowUpdate, allowDelete, sendParams, createArgs, createOnCompleteAction, updateArgs, deleteArgs, ...deployArgs } = deploy ?? {};
        if (this._appId !== 0) {
            throw new Error(`Attempt to deploy app which already has an app id of ${this._appId}`);
        }
        const sender = deploySender ?? this.sender;
        if (!sender) {
            throw new Error('No sender provided, unable to deploy app');
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const from = sender ?? this.sender;
        if (!this._creator) {
            throw new Error("Attempt to `deploy` a contract without specifying `resolveBy: 'creatorAndName'` in the constructor");
        }
        if (this._creator !== getSenderAddress(from)) {
            throw new Error(`Attempt to deploy contract with a sender address (${getSenderAddress(from)}) that differs from the given creator address for this application client: ${this._creator}`);
        }
        const approval = Buffer.from(this.appSpec.source.approval, 'base64').toString('utf-8');
        const compilation = {
            deployTimeParams: deployArgs.deployTimeParams,
            updatable: allowUpdate !== undefined
                ? allowUpdate
                : getDeployTimeControl(approval, this.appSpec, UPDATABLE_TEMPLATE_NAME, 'update_application'),
            deletable: allowDelete !== undefined
                ? allowDelete
                : getDeployTimeControl(approval, this.appSpec, DELETABLE_TEMPLATE_NAME, 'delete_application'),
        };
        const { approvalCompiled, clearCompiled } = await this.compile(compilation);
        try {
            await this.getAppReference();
            const result = await deployApp({
                from: sender,
                approvalProgram: approvalCompiled.compiledBase64ToBytes,
                clearStateProgram: clearCompiled.compiledBase64ToBytes,
                metadata: {
                    name: this._appName,
                    version: version ?? '1.0',
                    updatable: compilation.updatable,
                    deletable: compilation.deletable,
                },
                schema: {
                    globalByteSlices: this.appSpec.state.global.num_byte_slices,
                    globalInts: this.appSpec.state.global.num_uints,
                    localByteSlices: this.appSpec.state.local.num_byte_slices,
                    localInts: this.appSpec.state.local.num_uints,
                },
                transactionParams: this.params,
                ...(sendParams ?? {}),
                existingDeployments: this.existingDeployments,
                createArgs: await this.getCallArgs(createArgs, sender),
                createOnCompleteAction: createOnCompleteAction,
                updateArgs: await this.getCallArgs(updateArgs, sender),
                deleteArgs: await this.getCallArgs(deleteArgs, sender),
                ...deployArgs,
            }, this.algod, this.indexer);
            // Nothing needed to happen
            if (result.operationPerformed === 'nothing') {
                return result;
            }
            if (!this.existingDeployments) {
                throw new Error('Expected existingDeployments to be present');
            }
            const { transaction, confirmation, operationPerformed, ...appMetadata } = result;
            this.existingDeployments = {
                creator: this.existingDeployments.creator,
                apps: { ...this.existingDeployments.apps, [this._appName]: appMetadata },
            };
            return { ...result, ...{ compiledApproval: approvalCompiled, compiledClear: clearCompiled } };
        }
        catch (e) {
            throw this.exposeLogicError(e);
        }
    }
    /**
     * Creates a smart contract app, returns the details of the created app.
     * @param create The parameters to create the app with
     * @returns The details of the created app, or the transaction to create it if `skipSending` and the compilation result
     */
    async create(create) {
        const { sender: createSender, note, sendParams, deployTimeParams, updatable, deletable, onCompleteAction, ...args } = create ?? {};
        if (this._appId !== 0) {
            throw new Error(`Attempt to create app which already has an app id of ${this._appId}`);
        }
        const sender = createSender ?? this.sender;
        if (!sender) {
            throw new Error('No sender provided, unable to create app');
        }
        const { approvalCompiled, clearCompiled } = await this.compile(create);
        try {
            const result = await createApp({
                from: sender,
                approvalProgram: approvalCompiled.compiledBase64ToBytes,
                clearStateProgram: clearCompiled.compiledBase64ToBytes,
                schema: {
                    globalByteSlices: this.appSpec.state.global.num_byte_slices,
                    globalInts: this.appSpec.state.global.num_uints,
                    localByteSlices: this.appSpec.state.local.num_byte_slices,
                    localInts: this.appSpec.state.local.num_uints,
                },
                onCompleteAction,
                args: await this.getCallArgs(args, sender),
                note: note,
                transactionParams: this.params,
                ...(sendParams ?? {}),
            }, this.algod);
            if (result.confirmation) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                this._appId = result.confirmation.applicationIndex;
                this._appAddress = getApplicationAddress(this._appId);
            }
            return { ...result, ...{ compiledApproval: approvalCompiled, compiledClear: clearCompiled } };
        }
        catch (e) {
            throw this.exposeLogicError(e);
        }
    }
    /**
     * Updates the smart contract app.
     * @param update The parameters to update the app with
     * @returns The transaction send result and the compilation result
     */
    async update(update) {
        const { sender: updateSender, note, sendParams, deployTimeParams, updatable, deletable, ...args } = update ?? {};
        if (this._appId === 0) {
            throw new Error(`Attempt to update app which doesn't have an app id defined`);
        }
        const sender = updateSender ?? this.sender;
        if (!sender) {
            throw new Error('No sender provided, unable to create app');
        }
        const { approvalCompiled, clearCompiled } = await this.compile(update);
        try {
            const result = await updateApp({
                appId: this._appId,
                from: sender,
                approvalProgram: approvalCompiled.compiledBase64ToBytes,
                clearStateProgram: clearCompiled.compiledBase64ToBytes,
                args: await this.getCallArgs(args, sender),
                note: note,
                transactionParams: this.params,
                ...(sendParams ?? {}),
            }, this.algod);
            return { ...result, ...{ compiledApproval: approvalCompiled, compiledClear: clearCompiled } };
        }
        catch (e) {
            throw this.exposeLogicError(e);
        }
    }
    /**
     * Issues a no_op (normal) call to the app.
     * @param call The call details.
     * @returns The result of the call
     */
    async call(call) {
        if (
            // ABI call
            call?.method &&
            // We aren't skipping the send
            !call.sendParams?.skipSending &&
            // There isn't an ATC passed in
            !call.sendParams?.atc &&
            // The method is readonly
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.appSpec.hints[getABIMethodSignature(this.getABIMethod(call.method))].read_only) {
            const atc = new AtomicTransactionComposer();
            await this.callOfType({ ...call, sendParams: { ...call.sendParams, atc } }, 'no_op');
            const result = await atc.simulate(this.algod);
            if (result.simulateResponse.txnGroups.some((group) => group.failureMessage)) {
                throw new Error(result.simulateResponse.txnGroups.find((x) => x.failureMessage)?.failureMessage);
            }
            const txns = atc.buildGroup();
            return {
                transaction: txns[txns.length - 1].txn,
                confirmation: result.simulateResponse.txnGroups[0].txnResults.at(-1)?.txnResult,
                confirmations: result.simulateResponse.txnGroups[0].txnResults.map((t) => t.txnResult),
                transactions: txns.map((t) => t.txn),
                return: (result.methodResults?.length ?? 0 > 0) ? result.methodResults[result.methodResults.length - 1] : undefined,
            };
        }
        return await this.callOfType(call, 'no_op');
    }
    /**
     * Issues a opt_in call to the app.
     * @param call The call details.
     * @returns The result of the call
     */
    async optIn(call) {
        return await this.callOfType(call, 'opt_in');
    }
    /**
     * Issues a close_out call to the app.
     * @param call The call details.
     * @returns The result of the call
     */
    async closeOut(call) {
        return await this.callOfType(call, 'close_out');
    }
    /**
     * Issues a clear_state call to the app.
     * @param call The call details.
     * @returns The result of the call
     */
    async clearState(call) {
        return await this.callOfType(call, 'clear_state');
    }
    /**
     * Issues a delete_application call to the app.
     * @param call The call details.
     * @returns The result of the call
     */
    async delete(call) {
        return await this.callOfType(call, 'delete_application');
    }
    /**
     * Issues a call to the app with the given call type.
     * @param call The call details.
     * @param callType The call type
     * @returns The result of the call
     */
    async callOfType(call = {}, callType) {
        const { sender: callSender, note, sendParams, ...args } = call;
        const sender = callSender ?? this.sender;
        if (!sender) {
            throw new Error('No sender provided, unable to call app');
        }
        const appMetadata = await this.getAppReference();
        if (appMetadata.appId === 0) {
            throw new Error(`Attempt to call an app that can't be found '${this._appName}' for creator '${this._creator}'.`);
        }
        try {
            return await callApp({
                appId: appMetadata.appId,
                callType: callType,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                from: sender,
                args: await this.getCallArgs(args, sender),
                note: note,
                transactionParams: this.params,
                ...(sendParams ?? {}),
            }, this.algod);
        }
        catch (e) {
            throw this.exposeLogicError(e);
        }
    }
    /**
     * Funds ALGOs into the app account for this app.
     * @param fund The parameters for the funding or the funding amount
     * @returns The result of the funding
     */
    async fundAppAccount(fund) {
        const { amount, sender, note, sendParams } = 'microAlgos' in fund ? { amount: fund } : fund;
        if (!sender && !this.sender) {
            throw new Error('No sender provided, unable to call app');
        }
        const ref = await this.getAppReference();
        return await transferAlgos({
            to: ref.appAddress,
            amount: amount,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            from: sender ?? this.sender,
            note: note,
            transactionParams: this.params,
            ...(sendParams ?? {}),
        }, this.algod);
    }
    /**
     * Returns global state for the current app.
     * @returns The global state
     */
    async getGlobalState() {
        const appRef = await this.getAppReference();
        if (appRef.appId === 0) {
            throw new Error('No app has been created yet, unable to get global state');
        }
        return getAppGlobalState(appRef.appId, this.algod);
    }
    /**
     * Returns local state for the given account / account address.
     * @returns The global state
     */
    async getLocalState(account) {
        const appRef = await this.getAppReference();
        if (appRef.appId === 0) {
            throw new Error('No app has been created yet, unable to get global state');
        }
        return getAppLocalState(appRef.appId, account, this.algod);
    }
    /**
     * Returns the names of all current boxes for the current app.
     * @returns The names of the boxes
     */
    async getBoxNames() {
        const appRef = await this.getAppReference();
        if (appRef.appId === 0) {
            throw new Error('No app has been created yet, unable to get global state');
        }
        return await getAppBoxNames(appRef.appId, this.algod);
    }
    /**
     * Returns the value of the given box for the current app.
     * @param name The name of the box to return either as a string, binary array or `BoxName`
     * @returns The current box value as a byte array
     */
    async getBoxValue(name) {
        const appRef = await this.getAppReference();
        if (appRef.appId === 0) {
            throw new Error('No app has been created yet, unable to get global state');
        }
        return await getAppBoxValue(appRef.appId, name, this.algod);
    }
    /**
     * Returns the value of the given box for the current app.
     * @param name The name of the box to return either as a string, binary array or `BoxName`
     * @param type
     * @returns The current box value as a byte array
     */
    async getBoxValueFromABIType(name, type) {
        const appRef = await this.getAppReference();
        if (appRef.appId === 0) {
            throw new Error('No app has been created yet, unable to get global state');
        }
        return await getAppBoxValueFromABIType({ appId: appRef.appId, boxName: name, type }, this.algod);
    }
    /**
     * Returns the values of all current boxes for the current app.
     * Note: This will issue multiple HTTP requests (one per box) and it's not an atomic operation so values may be out of sync.
     * @param filter Optional filter to filter which boxes' values are returned
     * @returns The (name, value) pair of the boxes with values as raw byte arrays
     */
    async getBoxValues(filter) {
        const appRef = await this.getAppReference();
        if (appRef.appId === 0) {
            throw new Error('No app has been created yet, unable to get global state');
        }
        const names = await this.getBoxNames();
        return await Promise.all(names
            .filter(filter ?? ((_) => true))
            .map(async (boxName) => ({ name: boxName, value: await getAppBoxValue(appRef.appId, boxName, this.algod) })));
    }
    /**
     * Returns the values of all current boxes for the current app decoded using an ABI Type.
     * Note: This will issue multiple HTTP requests (one per box) and it's not an atomic operation so values may be out of sync.
     * @param type The ABI type to decode the values with
     * @param filter Optional filter to filter which boxes' values are returned
     * @returns The (name, value) pair of the boxes with values as the ABI Value
     */
    async getBoxValuesFromABIType(type, filter) {
        const appRef = await this.getAppReference();
        if (appRef.appId === 0) {
            throw new Error('No app has been created yet, unable to get global state');
        }
        const names = await this.getBoxNames();
        return await Promise.all(names.filter(filter ?? ((_) => true)).map(async (boxName) => ({
            name: boxName,
            value: await getAppBoxValueFromABIType({ appId: appRef.appId, boxName, type }, this.algod),
        })));
    }
    /**
     * Returns the arguments for an app call for the given ABI method or raw method specification.
     * @param args The call args specific to this application client
     * @param sender The sender of this call. Will be used to fetch any default argument values if applicable
     * @returns The call args ready to pass into an app call
     */
    async getCallArgs(args, sender) {
        if (!args) {
            return undefined;
        }
        if (args.method) {
            const abiMethod = this.getABIMethodParams(args.method);
            if (!abiMethod) {
                throw new Error(`Attempt to call ABI method ${args.method}, but it wasn't found`);
            }
            const methodSignature = getABIMethodSignature(abiMethod);
            return {
                ...args,
                method: abiMethod,
                methodArgs: await Promise.all(args.methodArgs.map(async (arg, index) => {
                    if (arg !== undefined)
                        return arg;
                    const argName = abiMethod.args[index].name;
                    const defaultValueStrategy = argName && this.appSpec.hints?.[methodSignature]?.default_arguments?.[argName];
                    if (!defaultValueStrategy)
                        throw new Error(`Argument at position ${index} with the name ${argName} is undefined and does not have a default value strategy`);
                    switch (defaultValueStrategy.source) {
                        case 'constant':
                            return defaultValueStrategy.data;
                        case 'abi-method': {
                            const method = defaultValueStrategy.data;
                            const result = await this.callOfType({
                                method: getABIMethodSignature(method),
                                methodArgs: method.args.map(() => undefined),
                                sender,
                            }, 'no_op');
                            return result.return?.returnValue;
                        }
                        case 'local-state':
                        case 'global-state': {
                            const state = defaultValueStrategy.source === 'global-state' ? await this.getGlobalState() : await this.getLocalState(sender);
                            const key = defaultValueStrategy.data;
                            if (key in state) {
                                return state[key].value;
                            }
                            else {
                                throw new Error(`Preparing default value for argument at position ${index} with the name ${argName} resulted in the failure: The key '${key}' could not be found in ${defaultValueStrategy.source}`);
                            }
                        }
                    }
                })),
            };
        }
        else {
            return args;
        }
    }
    /**
     * Returns the ABI Method parameters for the given method name string for the app represented by this application client instance
     * @param method Either the name of the method or the ABI method spec definition string
     * @returns The ABI method params for the given method
     */
    getABIMethodParams(method) {
        if (!method.includes('(')) {
            const methods = this.appSpec.contract.methods.filter((m) => m.name === method);
            if (methods.length > 1) {
                throw new Error(`Received a call to method ${method} in contract ${this._appName}, but this resolved to multiple methods; please pass in an ABI signature instead: ${methods
                    .map(getABIMethodSignature)
                    .join(', ')}`);
            }
            return methods[0];
        }
        return this.appSpec.contract.methods.find((m) => getABIMethodSignature(m) === method);
    }
    /**
     * Returns the ABI Method for the given method name string for the app represented by this application client instance
     * @param method Either the name of the method or the ABI method spec definition string
     * @returns The ABI method for the given method
     */
    getABIMethod(method) {
        const methodParams = this.getABIMethodParams(method);
        return methodParams ? new ABIMethod(methodParams) : undefined;
    }
    /**
     * Gets the reference information for the current application instance.
     * `appId` will be 0 if it can't find an app.
     * @returns The app reference, or if deployed using the `deploy` method, the app metadata too
     */
    async getAppReference() {
        if (!this.existingDeployments && this._creator) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.existingDeployments = await getCreatorAppsByName(this._creator, this.indexer);
        }
        if (this.existingDeployments && this._appId === 0) {
            const app = this.existingDeployments.apps[this._appName];
            if (!app) {
                return {
                    appId: 0,
                    appAddress: getApplicationAddress(0),
                };
            }
            return app;
        }
        return {
            appId: this._appId,
            appAddress: this._appAddress,
        };
    }
    /**
     * Takes an error that may include a logic error from a smart contract call and re-exposes the error to include source code information via the source map.
     * This is automatically used within `ApplicationClient` but if you pass `skipSending: true` e.g. if doing a group transaction
     *  then you can use this in a try/catch block to get better debugging information.
     * @param e The error to parse
     * @param isClear Whether or not the code was running the clear state program
     * @returns The new error, or if there was no logic error or source map then the wrapped error with source details
     */
    exposeLogicError(e, isClear) {
        if ((!isClear && this._approvalSourceMap == undefined) || (isClear && this._clearSourceMap == undefined))
            return e;
        const errorDetails = LogicError.parseLogicError(e);
        if (errorDetails !== undefined)
            return new LogicError(errorDetails, Buffer.from(isClear ? this.appSpec.source.clear : this.appSpec.source.approval, 'base64')
                .toString()
                .split('\n'),
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                isClear ? this._clearSourceMap : this._approvalSourceMap);
        else
            return e;
    }
}
//# sourceMappingURL=app-client.js.map