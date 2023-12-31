import { AlgoKitLogCaptureFixture } from '../../types/testing';
/**
 * Creates a test fixture for capturing AlgoKit logs.
 *
 * @example
 * ```typescript
 * const logs = algoKitLogCaptureFixture()
 *
 * beforeEach(logs.beforeEach)
 * afterEach(logs.afterEach)
 *
 * test('My test', () => {
 *     const capturedLogs = logs.testLogger.capturedLogs
 * })
 * ```
 *
 * @returns The fixture
 */
export declare const algoKitLogCaptureFixture: () => AlgoKitLogCaptureFixture;
//# sourceMappingURL=algokit-log-capture-fixture.d.ts.map