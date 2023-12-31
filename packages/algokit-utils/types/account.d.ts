import algosdk from 'algosdk';
import { AccountConfig, MultisigAccount, SigningAccount, TransactionSignerAccount } from './types/account';
import { AlgoAmount } from './types/amount';
import { SendTransactionFrom } from './types/transaction';
import Account = algosdk.Account;
import Algodv2 = algosdk.Algodv2;
import Kmd = algosdk.Kmd;
import MultisigMetadata = algosdk.MultisigMetadata;
import TransactionSigner = algosdk.TransactionSigner;
/**
 * Returns an account wrapper that supports partial or full multisig signing.
 * @param multisigParams The parameters that define the multisig account
 * @param signingAccounts The signers that are currently present
 * @returns A multisig account wrapper
 */
export declare function multisigAccount(multisigParams: MultisigMetadata, signingAccounts: (Account | SigningAccount)[]): MultisigAccount;
/**
 * Returns an account wrapper that supports a rekeyed account.
 * @param signer The account, with private key loaded, that is signing
 * @param sender The address of the rekeyed account that will act as a sender
 * @returns The SigningAccount wrapper
 */
export declare function rekeyedAccount(signer: Account, sender: string): SigningAccount;
/**
 * Returns an account wrapper that supports a transaction signer with associated sender address.
 * @param signer The transaction signer
 * @param sender The address of sender account
 * @returns The SigningAccount wrapper
 */
export declare function transactionSignerAccount(signer: TransactionSigner, sender: string): TransactionSignerAccount;
/** Returns an Algorand account with secret key loaded (i.e. that can sign transactions) by taking the mnemonic secret.
 *
 * This is a wrapper around algosdk.mnemonicToSecretKey to provide a more friendly/obvious name.
 *
 * @param mnemonicSecret The mnemonic secret representing the private key of an account; **Note: Be careful how the mnemonic is handled**,
 *  never commit it into source control and ideally load it from the environment (ideally via a secret storage service) rather than the file system.
 */
export declare function mnemonicAccount(mnemonicSecret: string): Account;
/** Returns a new, random Algorand account with secret key loaded.
 *
 * This is a wrapper around algosdk.generateAccount to provide a more friendly/obvious name.
 *
 */
export declare function randomAccount(): Account;
/**  @deprecated use mnemonicAccountFromEnvironment instead
 *
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
 * const account = await getAccount('ACCOUNT', algod)
 * ```
 *
 * If that code runs against LocalNet then a wallet called `ACCOUNT` will automatically be created with an account that is automatically funded with 1000 (default) ALGOs from the default LocalNet dispenser.
 *
 * @param account The details of the account to get, either the name identifier (string) or an object with:
 *   * `name`: The name identifier of the account
 *   * `fundWith`: The amount to fund the account with when it gets created (when targeting LocalNet), if not specified then 1000 Algos will be funded from the dispenser account
 * @param algod An algod client
 * @param kmdClient An optional KMD client to use to create an account (when targeting LocalNet), if not specified then a default KMD client will be loaded from environment variables
 * @returns The requested account with private key loaded from the environment variables or when targeting LocalNet from KMD (idempotently creating and funding the account)
 */
export declare function getAccount(account: {
    name: string;
    fundWith?: AlgoAmount;
} | string, algod: Algodv2, kmdClient?: Kmd): Promise<Account | SigningAccount>;
/**  @deprecated use mnemonicAccountFromEnvironment instead
 * Returns an Algorand account with private key loaded by convention based on the given name identifier.
 *
 * Note: This function expects to run in a Node.js environment.
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
 * @param account The details of the account to get, an object with:
 *   * `config`: Account configuration. To get from environment use getAccountConfigFromEnvironment(accountName)
 *   * `fundWith`: The amount to fund the account with when it gets created (when targeting LocalNet), if not specified then 1000 Algos will be funded from the dispenser account
 * @param algod An algod client
 * @param kmdClient An optional KMD client to use to create an account (when targeting LocalNet), if not specified then a default KMD client will be loaded from environment variables
 * @returns The requested account with private key loaded from the environment variables or when targeting LocalNet from KMD (idempotently creating and funding the account)
 */
export declare function getAccount(account: {
    config: AccountConfig;
    fundWith?: AlgoAmount;
}, algod: Algodv2, kmdClient?: Kmd): Promise<Account | SigningAccount>;
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
export declare function mnemonicAccountFromEnvironment(account: string | {
    name: string;
    fundWith?: AlgoAmount;
}, algod: Algodv2, kmdClient?: Kmd): Promise<Account | SigningAccount>;
/** Returns an account's address as a byte array
 *
 * @param account Either an account (with private key loaded) or the string address of an account
 */
export declare function getAccountAddressAsUint8Array(account: SendTransactionFrom | string): Uint8Array;
/** Returns the string address of an Algorand account from a base64 encoded version of the underlying byte array of the address public key
 *
 * @param addressEncodedInB64 The base64 encoded version of the underlying byte array of the address public key
 */
export declare function getAccountAddressAsString(addressEncodedInB64: string): string;
/** Returns an account (with private key loaded) that can act as a dispenser
 *
 * If running on LocalNet then it will return the default dispenser account automatically,
 *  otherwise it will load the account mnemonic stored in process.env.DISPENSER_MNEMONIC
 *
 * @param algod An algod client
 * @param kmd A KMD client, if not specified then a default KMD client will be loaded from environment variables
 */
export declare function getDispenserAccount(algod: Algodv2, kmd?: Kmd): Promise<algosdk.Account | SigningAccount>;
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
export declare function getAccountConfigFromEnvironment(accountName: string): AccountConfig;
//# sourceMappingURL=account.d.ts.map