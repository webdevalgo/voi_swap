import algosdk from 'algosdk';
import { AlgoAmount } from './types/amount';
import Account = algosdk.Account;
import Algodv2 = algosdk.Algodv2;
import Kmd = algosdk.Kmd;
/** Returns true if the algod client is pointing to a LocalNet Algorand network */
export declare function isLocalNet(algod: Algodv2): Promise<boolean>;
/**
 * Gets an account with private key loaded from a KMD wallet of the given name, or alternatively creates one with funds in it via a KMD wallet of the given name.
 *
 * This is useful to get idempotent accounts from LocalNet without having to specify the private key (which will change when resetting the LocalNet).
 *
 * This significantly speeds up local dev time and improves experience since you can write code that *just works* first go without manual config in a fresh LocalNet.
 *
 * If this is used via `mnemonicAccountFromEnvironment`, then you can even use the same code that runs on production without changes for local development!
 *
 * @param walletAccount The wallet details with:
 *   * `name`: The name of the wallet to retrieve / create
 *   * `fundWith`: The number of Algos to fund the account with when it gets created, if not specified then 1000 Algos will be funded from the dispenser account
 * @param algod An algod client
 * @param kmdClient A KMD client, if not specified then a default KMD client will be loaded from environment variables
 *
 * @returns An Algorand account with private key loaded - either one that already existed in the given KMD wallet, or a new one that is funded for you
 */
export declare function getOrCreateKmdWalletAccount(walletAccount: {
    name: string;
    fundWith?: AlgoAmount;
}, algod: Algodv2, kmdClient?: Kmd): Promise<Account>;
/**
 * Returns an Algorand account with private key loaded from the given KMD wallet (identified by name).
 *
 * @param walletAccount The details of the wallet, with:
 *   * `name`: The name of the wallet to retrieve an account from
 *   * `predicate`: An optional filter to use to find the account (otherwise it will return a random account from the wallet)
 * @param algod An algod client
 * @param kmdClient A KMD client, if not specified then a default KMD client will be loaded from environment variables
 * @example Get default funded account in a LocalNet
 *
 * ```typescript
 * const defaultDispenserAccount = await getKmdWalletAccount(algod,
 *   'unencrypted-default-wallet',
 *   a => a.status !== 'Offline' && a.amount > 1_000_000_000
 * )
 * ```
 */
export declare function getKmdWalletAccount(walletAccount: {
    name: string;
    predicate?: (account: Record<string, any>) => boolean;
}, algod: Algodv2, kmdClient?: Kmd): Promise<Account | undefined>;
/**
 * Returns an Algorand account with private key loaded for the default LocalNet dispenser account (that can be used to fund other accounts)
 *
 * @param algod An algod client
 * @param kmd A KMD client, if not specified then a default KMD client will be loaded from environment variables
 */
export declare function getLocalNetDispenserAccount(algod: Algodv2, kmd?: Kmd): Promise<Account>;
//# sourceMappingURL=localnet.d.ts.map