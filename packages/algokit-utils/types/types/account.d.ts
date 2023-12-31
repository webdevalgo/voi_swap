import algosdk from 'algosdk';
import Account = algosdk.Account;
import MultisigMetadata = algosdk.MultisigMetadata;
import Transaction = algosdk.Transaction;
import TransactionSigner = algosdk.TransactionSigner;
/**
 * The account name identifier used for fund dispensing in test environments
 */
export declare const DISPENSER_ACCOUNT = "DISPENSER";
/** Account wrapper that supports partial or full multisig signing. */
export declare class MultisigAccount {
    _params: algosdk.MultisigMetadata;
    _signingAccounts: (algosdk.Account | SigningAccount)[];
    _addr: string;
    _signer: TransactionSigner;
    /** The parameters for the multisig account */
    get params(): Readonly<algosdk.MultisigMetadata>;
    /** The list of accounts that are present to sign */
    get signingAccounts(): Readonly<(algosdk.Account | SigningAccount)[]>;
    /** The address of the multisig account */
    get addr(): Readonly<string>;
    get signer(): TransactionSigner;
    constructor(multisigParams: MultisigMetadata, signingAccounts: (Account | SigningAccount)[]);
    /**
     * Sign the given transaction
     * @param transaction Either a transaction object or a raw, partially signed transaction
     * @returns The transaction signed by the present signers
     */
    sign(transaction: Transaction | Uint8Array): Uint8Array;
}
/** Account wrapper that supports a rekeyed account */
export declare class SigningAccount implements Account {
    private _account;
    private _signer;
    private _sender;
    /**
     * Algorand address of the sender
     */
    get addr(): Readonly<string>;
    /**
     * Secret key belonging to the signer
     */
    get sk(): Readonly<Uint8Array>;
    /**
     * Transaction signer for the underlying signing account
     */
    get signer(): TransactionSigner;
    /**
     * Algorand account of the sender address and signer private key
     */
    get sender(): Account;
    constructor(account: Account, sender: string | undefined);
}
/** A wrapper around `TransactionSigner` that also has the sender address. */
export interface TransactionSignerAccount {
    addr: Readonly<string>;
    signer: TransactionSigner;
}
/** Config for an account config */
export interface AccountConfig {
    /** Mnemonic for an account */
    accountMnemonic: string;
    /** Address of a rekeyed account */
    senderAddress?: string;
    /** Account name used to retrieve config */
    accountName: string;
    /** @deprecated Renamed to senderAddress in 2.3.1 */
    senderMnemonic?: string;
}
//# sourceMappingURL=account.d.ts.map