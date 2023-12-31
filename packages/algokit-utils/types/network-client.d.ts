import algosdk from 'algosdk';
import { AlgoClientConfig, AlgoConfig } from './types/network-client';
import Algodv2 = algosdk.Algodv2;
import Indexer = algosdk.Indexer;
import Kmd = algosdk.Kmd;
/** Retrieve configurations from environment variables when defined or get defaults (expects to be called from a Node.js environment not algod-side) */
export declare function getConfigFromEnvOrDefaults(): AlgoConfig;
/** Retrieve the algod configuration from environment variables (expects to be called from a Node.js environment not algod-side) */
export declare function getAlgodConfigFromEnvironment(): AlgoClientConfig;
/** Retrieve the indexer configuration from environment variables (expects to be called from a Node.js environment not algod-side) */
export declare function getIndexerConfigFromEnvironment(): AlgoClientConfig;
/** Returns the Algorand configuration to point to the AlgoNode service
 *
 * @param network Which network to connect to - TestNet or MainNet
 * @param config Which algod config to return - Algod or Indexer
 */
export declare function getAlgoNodeConfig(network: 'testnet' | 'mainnet', config: 'algod' | 'indexer'): AlgoClientConfig;
/** Returns the Algorand configuration to point to the default LocalNet
 *
 * @param configOrPort Which algod config to return - algod, kmd, or indexer OR a port number
 */
export declare function getDefaultLocalNetConfig(configOrPort: 'algod' | 'indexer' | 'kmd' | number): AlgoClientConfig;
/** Returns an algod SDK client that automatically retries on idempotent calls
 *
 * @param config The config if you want to override the default (getting config from process.env)
 * @example Default (load from environment variables)
 *
 *  ```typescript
 *  // Uses process.env.ALGOD_SERVER, process.env.ALGOD_PORT and process.env.ALGOD_TOKEN
 *  // Automatically detects if you are using PureStake to switch in the right header name for ALGOD_TOKEN
 *  const algod = getAlgoClient()
 *  await algod.healthCheck().do()
 *  ```
 * @example AlgoNode (testnet)
 * ```typescript
 *  const algod = getAlgoClient(getAlgoNodeConfig('testnet', 'algod'))
 *  await algod.healthCheck().do()
 * ```
 * @example AlgoNode (mainnet)
 * ```typescript
 *  const algod = getAlgoClient(getAlgoNodeConfig('mainnet', 'algod'))
 *  await algod.healthCheck().do()
 * ```
 * @example Custom (e.g. default LocalNet, although we recommend loading this into a .env and using the Default option instead)
 * ```typescript
 *  const algod = getAlgoClient({server: 'http://localhost', port: '4001', token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'})
 *  await algod.healthCheck().do()
 * ```
 */
export declare function getAlgoClient(config?: AlgoClientConfig): Algodv2;
/** Returns an indexer SDK client that automatically retries on idempotent calls
 *
 * @param config The config if you want to override the default (getting config from process.env)
 * @example Default (load from environment variables)
 *
 *  ```typescript
 *  // Uses process.env.INDEXER_SERVER, process.env.INDEXER_PORT and process.env.INDEXER_TOKEN
 *  // Automatically detects if you are using PureStake to switch in the right header name for INDEXER_TOKEN
 *  const indexer = getAlgoIndexerClient()
 *  await indexer.makeHealthCheck().do()
 *  ```
 * @example AlgoNode (testnet)
 * ```typescript
 *  const indexer = getAlgoIndexerClient(getAlgoNodeConfig('testnet', 'indexer'))
 *  await indexer.makeHealthCheck().do()
 * ```
 * @example AlgoNode (mainnet)
 * ```typescript
 *  const indexer = getAlgoIndexerClient(getAlgoNodeConfig('mainnet', 'indexer'))
 *  await indexer.makeHealthCheck().do()
 * ```
 * @example Custom (e.g. default LocalNet, although we recommend loading this into a .env and using the Default option instead)
 * ```typescript
 *  const indexer = getAlgoIndexerClient({server: 'http://localhost', port: '8980', token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'})
 *  await indexer.makeHealthCheck().do()
 * ```
 */
export declare function getAlgoIndexerClient(config?: AlgoClientConfig): Indexer;
/**
 * Returns a KMD SDK client that automatically retries on idempotent calls
 *
 * KMD client allows you to export private keys, which is useful to get the default account in a LocalNet network.
 *
 * @param config The config if you want to override the default (getting config from process.env)
 * @example Default (load from environment variables)
 *
 *  ```typescript
 *  // Uses process.env.ALGOD_SERVER, process.env.KMD_PORT (or if not specified: port 4002) and process.env.ALGOD_TOKEN
 *  const kmd = getAlgoKmdClient()
 *  ```
 * @example Custom (e.g. default LocalNet, although we recommend loading this into a .env and using the Default option instead)
 * ```typescript
 *  const kmd = getAlgoKmdClient({server: 'http://localhost', port: '4002', token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'})
 * ```
 */
export declare function getAlgoKmdClient(config?: AlgoClientConfig): Kmd;
export declare function isTestNet(algod: Algodv2): Promise<boolean>;
export declare function isMainNet(algod: Algodv2): Promise<boolean>;
export { isLocalNet } from './localnet';
//# sourceMappingURL=network-client.d.ts.map