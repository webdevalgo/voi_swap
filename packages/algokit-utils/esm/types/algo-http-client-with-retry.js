import { URLTokenBaseHTTPClient } from './urlTokenBaseHTTPClient.js';
/** A HTTP Client that wraps the Algorand SDK HTTP Client with retries */
export class AlgoHttpClientWithRetry extends URLTokenBaseHTTPClient {
    static MAX_TRIES = 5;
    static MAX_BACKOFF_MS = 10000;
    // These lists come from https://visionmedia.github.io/superagent/#retrying-requests
    // which is the underlying library used by algosdk - but the CloudFlare specific 52X status codes have been removed
    static RETRY_STATUS_CODES = [408, 413, 429, 500, 502, 503, 504];
    static RETRY_ERROR_CODES = [
        'ETIMEDOUT',
        'ECONNRESET',
        'EADDRINUSE',
        'ECONNREFUSED',
        'EPIPE',
        'ENOTFOUND',
        'ENETUNREACH',
        'EAI_AGAIN',
        'EPROTO', // We get this intermittently with AlgoNode API
    ];
    async callWithRetry(func) {
        let response;
        let numTries = 1;
        do {
            try {
                response = await func();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }
            catch (err) {
                if (numTries >= AlgoHttpClientWithRetry.MAX_TRIES) {
                    throw err;
                }
                // Only retry for one of the hardcoded conditions
                if (!(AlgoHttpClientWithRetry.RETRY_ERROR_CODES.includes(err.code) ||
                    AlgoHttpClientWithRetry.RETRY_STATUS_CODES.includes(Number(err.status)) ||
                    ('response' in err && AlgoHttpClientWithRetry.RETRY_STATUS_CODES.includes(Number(err.response.status))))) {
                    throw err;
                }
                // Retry immediately the first time, then exponentially backoff.
                const delayTimeMs = numTries == 1 ? 0 : Math.min(1000 * Math.pow(2, numTries - 1), AlgoHttpClientWithRetry.MAX_BACKOFF_MS);
                if (delayTimeMs > 0) {
                    await new Promise((r) => setTimeout(r, delayTimeMs));
                }
            }
        } while (!response && ++numTries <= AlgoHttpClientWithRetry.MAX_TRIES);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return response;
    }
    async get(relativePath, query, requestHeaders = {}) {
        return await this.callWithRetry(() => super.get(relativePath, query, requestHeaders));
    }
    async post(relativePath, data, query, requestHeaders = {}) {
        return await this.callWithRetry(() => super.post(relativePath, data, query, requestHeaders));
    }
    async delete(relativePath, data, query, requestHeaders = {}) {
        return await this.callWithRetry(() => super.delete(relativePath, data, query, requestHeaders));
    }
}
//# sourceMappingURL=algo-http-client-with-retry.js.map