import algosdk from 'algosdk';
import { GetTestAccountParams } from '../types/testing';
import Account = algosdk.Account;
import Algodv2 = algosdk.Algodv2;
import Kmd = algosdk.Kmd;
/**
 * Creates an ephemeral Algorand account for the purposes of testing.
 * Returns a newly created random test account that is funded from the dispenser
 * DO NOT USE THIS TO CREATE A MAINNET ACCOUNT!
 * Note: By default this will log the mnemonic of the account.
 * @param param0 The config for the test account to generate
 * @param algod An algod client
 * @param kmd A KMD client, if not specified then a default KMD client will be loaded from environment variables
 * @returns The account, with private key loaded
 */
export declare function getTestAccount({ suppressLog, initialFunds }: GetTestAccountParams, algod: Algodv2, kmd?: Kmd): Promise<Account>;
//# sourceMappingURL=account.d.ts.map