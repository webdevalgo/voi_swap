import algosdk from 'algosdk';
import { getLocalNetDispenserAccount, getOrCreateKmdWalletAccount } from './localnet.js';
import { isLocalNet } from './network-client.js';
import { getSenderAddress } from './transaction.js';
import { DISPENSER_ACCOUNT, MultisigAccount, SigningAccount } from './types/account.js';
/**
 * Returns an account wrapper that supports partial or full multisig signing.
 * @param multisigParams The parameters that define the multisig account
 * @param signingAccounts The signers that are currently present
 * @returns A multisig account wrapper
 */
export function multisigAccount(multisigParams, signingAccounts) {
    return new MultisigAccount(multisigParams, signingAccounts);
}
/**
 * Returns an account wrapper that supports a rekeyed account.
 * @param signer The account, with private key loaded, that is signing
 * @param sender The address of the rekeyed account that will act as a sender
 * @returns The SigningAccount wrapper
 */
export function rekeyedAccount(signer, sender) {
    return new SigningAccount(signer, sender);
}
/**
 * Returns an account wrapper that supports a transaction signer with associated sender address.
 * @param signer The transaction signer
 * @param sender The address of sender account
 * @returns The SigningAccount wrapper
 */
export function transactionSignerAccount(signer, sender) {
    return { addr: sender, signer };
}
/** Returns an Algorand account with secret key loaded (i.e. that can sign transactions) by taking the mnemonic secret.
 *
 * This is a wrapper around algosdk.mnemonicToSecretKey to provide a more friendly/obvious name.
 *
 * @param mnemonicSecret The mnemonic secret representing the private key of an account; **Note: Be careful how the mnemonic is handled**,
 *  never commit it into source control and ideally load it from the environment (ideally via a secret storage service) rather than the file system.
 */
export function mnemonicAccount(mnemonicSecret) {
    // This method is confusingly named, so this function provides a more dev friendly "wrapper" name
    return algosdk.mnemonicToSecretKey(mnemonicSecret);
}
/** Returns a new, random Algorand account with secret key loaded.
 *
 * This is a wrapper around algosdk.generateAccount to provide a more friendly/obvious name.
 *
 */
export function randomAccount() {
    // This method is confusingly named, so this function provides a more dev friendly "wrapper" name
    return algosdk.generateAccount();
}
/**  @deprecated use mnemonicAccountFromEnvironment instead
 * Returns an Algorand account with private key loaded by convention based on the given name identifier.
 *
 * Note: This function expects to run in a Node.js environment.
 *
 * ## Convention:
 * * **Non-LocalNet:** will load process.env['\{NAME\}_MNEMONIC'] as a mnemonic secret; **Note: Be careful how the mnemonic is handled**,
 *  never commit it into source control and ideally load it via a secret storage service rather than the file system.
 *   If process.env['\{NAME\}_SENDER'] is defined then it will use that for the sender address (i.e. to support rekeyed accounts)
 * * **LocalNet:** will load the account from a KMD wallet called \{NAME\} and if that wallet doesn't exist it will create it and fund the account for you
 *
 * This allows you to write code that will work seamlessly in production and local development (LocalNet) without manual config locally (including when you reset the LocalNet).
 *
 * @example Default
 *
 * If you have a mnemonic secret loaded into `process.env.ACCOUNT_MNEMONIC` then you can call the following to get that private key loaded into an account object:
 * ```typescript
 * const account = await getAccount({config: getAccountConfigFromEnvironment('ACCOUNT')}, algod)
 * ```
 *
 * If that code runs against LocalNet then a wallet called `ACCOUNT` will automatically be created with an account that is automatically funded with 1000 (default) ALGOs from the default LocalNet dispenser.
 *
 * @param account The details of the account to get, either the name identifier (string) or an object with:
 *   * `config`: Account configuration. To get from environment use getAccountConfigFromEnvironment(accountName) OR
 *   * `name`: string: The name identifier of the account (deprecated)
 *   And optionally
 *   * `fundWith`: The amount to fund the account with when it gets created (when targeting LocalNet), if not specified then 1000 Algos will be funded from the dispenser account
 * @param algod An algod client
 * @param kmdClient An optional KMD client to use to create an account (when targeting LocalNet), if not specified then a default KMD client will be loaded from environment variables
 * @returns The requested account with private key loaded from the environment variables or when targeting LocalNet from KMD (idempotently creating and funding the account)
 */
export async function getAccount(account, algod, kmdClient) {
    let name;
    let fundWith = undefined;
    let config;
    if (typeof account === 'string') {
        name = account;
        config = getAccountConfigFromEnvironment(name);
    }
    else if ('name' in account) {
        name = account.name;
        config = getAccountConfigFromEnvironment(name);
        fundWith = account.fundWith;
    }
    else if ('config' in account) {
        config = account.config;
        name = config.accountName;
        fundWith = account.fundWith;
    }
    else {
        throw new Error('Missing name or account config');
    }
    if (config.accountMnemonic) {
        const signer = mnemonicAccount(config.accountMnemonic);
        const sender = config.senderAddress || config.senderMnemonic;
        if (sender) {
            return new SigningAccount(signer, sender);
        }
        else {
            return signer;
        }
    }
    if (await isLocalNet(algod)) {
        const account = await getOrCreateKmdWalletAccount({ name, fundWith }, algod, kmdClient);
        config.accountMnemonic = algosdk.secretKeyToMnemonic(account.sk);
        return account;
    }
    throw new Error(`Missing environment variable ${name.toUpperCase()}_MNEMONIC when looking for account ${name}`);
}
/**
 * Returns an Algorand account with private key loaded by convention from environment variables based on the given name identifier.
 *
 * Note: This function expects to run in a Node.js environment.
 *
 * ## Convention:
 * * **Non-LocalNet:** will load process.env['\{NAME\}_MNEMONIC'] as a mnemonic secret; **Note: Be careful how the mnemonic is handled**,
 *  never commit it into source control and ideally load it via a secret storage service rather than the file system.
 *   If process.env['\{NAME\}_SENDER'] is defined then it will use that for the sender address (i.e. to support rekeyed accounts)
 * * **LocalNet:** will load the account from a KMD wallet called \{NAME\} and if that wallet doesn't exist it will create it and fund the account for you
 *
 * This allows you to write code that will work seamlessly in production and local development (LocalNet) without manual config locally (including when you reset the LocalNet).
 *
 * @example Default
 *
 * If you have a mnemonic secret loaded into `process.env.MY_ACCOUNT_MNEMONIC` then you can call the following to get that private key loaded into an account object:
 * ```typescript
 * const account = await mnemonicAccountFromEnvironment('MY_ACCOUNT', algod)
 * ```
 *
 * If that code runs against LocalNet then a wallet called `MY_ACCOUNT` will automatically be created with an account that is automatically funded with 1000 (default) ALGOs from the default LocalNet dispenser.
 * If not running against LocalNet then it will use proces.env.MY_ACCOUNT_MNEMONIC as the private key and (if present) process.env.MY_ACCOUNT_SENDER as the sender address.
 *
 * @param account The details of the account to get, either the name identifier (string) or an object with:
 *   * `name`: string: The name identifier of the account
 *   * `fundWith`: The amount to fund the account with when it gets created (when targeting LocalNet), if not specified then 1000 Algos will be funded from the dispenser account
 * @param algod An algod client
 * @param kmdClient An optional KMD client to use to create an account (when targeting LocalNet), if not specified then a default KMD client will be loaded from environment variables
 * @returns The requested account with private key loaded from the environment variables or when targeting LocalNet from KMD (idempotently creating and funding the account)
 */
export async function mnemonicAccountFromEnvironment(account, algod, kmdClient) {
    const { name, fundWith } = typeof account === 'string' ? { name: account, fundWith: undefined } : account;
    // todo: When eventually removing this method, inline it here
    const config = getAccountConfigFromEnvironment(name);
    if (config.accountMnemonic) {
        const signer = mnemonicAccount(config.accountMnemonic);
        const sender = config.senderAddress;
        if (sender) {
            return new SigningAccount(signer, sender);
        }
        else {
            return signer;
        }
    }
    if (await isLocalNet(algod)) {
        return await getOrCreateKmdWalletAccount({ name, fundWith }, algod, kmdClient);
    }
    throw new Error(`Missing environment variable ${name.toUpperCase()}_MNEMONIC when looking for account ${name}`);
}
/** Returns an account's address as a byte array
 *
 * @param account Either an account (with private key loaded) or the string address of an account
 */
export function getAccountAddressAsUint8Array(account) {
    return algosdk.decodeAddress(typeof account === 'string' ? account : getSenderAddress(account)).publicKey;
}
/** Returns the string address of an Algorand account from a base64 encoded version of the underlying byte array of the address public key
 *
 * @param addressEncodedInB64 The base64 encoded version of the underlying byte array of the address public key
 */
export function getAccountAddressAsString(addressEncodedInB64) {
    return algosdk.encodeAddress(Buffer.from(addressEncodedInB64, 'base64'));
}
/** Returns an account (with private key loaded) that can act as a dispenser
 *
 * If running on LocalNet then it will return the default dispenser account automatically,
 *  otherwise it will load the account mnemonic stored in process.env.DISPENSER_MNEMONIC
 *
 * @param algod An algod client
 * @param kmd A KMD client, if not specified then a default KMD client will be loaded from environment variables
 */
export async function getDispenserAccount(algod, kmd) {
    // If we are running against LocalNet we can use the default account within it, otherwise use an automation account specified via environment variables and ensure it's populated with ALGOs
    const canFundFromDefaultAccount = await isLocalNet(algod);
    return canFundFromDefaultAccount ? await getLocalNetDispenserAccount(algod, kmd) : await getAccount(DISPENSER_ACCOUNT, algod);
}
/**  @deprecated Use algokit.mnemonicAccountFromEnvironment, which doesn't need this function
 * Returns the Account configuration from environment variables
 *
 * @param accountName account name
 *
 * @example environment variables
 * {accountName}_MNEMONIC
 * {accountName}_SENDER
 *
 */
export function getAccountConfigFromEnvironment(accountName) {
    if (!process || !process.env) {
        throw new Error('Attempt to get account with private key from a non Node.js context; not supported!');
    }
    return {
        accountMnemonic: process.env[`${accountName.toUpperCase()}_MNEMONIC`] || '',
        senderAddress: process.env[`${accountName.toUpperCase()}_SENDER`],
        accountName,
    };
}
//# sourceMappingURL=account.js.map