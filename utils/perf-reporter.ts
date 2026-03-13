import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface PerfRecord {
    suite: string;
    test: string;
    status: string;
    startTime: number;
    endTime: number;
    durationMs: number;
    baseUrl: string;
    patientName: string;
    inputTokens: string;
    outputTokens: string;
    noteGenMs: string;
    noteGenSec: string;
    testType: string;
}

function percentile(sorted: number[], q: number): number {
    if (sorted.length === 0) return 0;
    let idx = Math.ceil(q * sorted.length) - 1;
    idx = Math.max(0, Math.min(idx, sorted.length - 1));
    return sorted[idx];
}

function safeCsv(s: string | undefined | null): string {
    return (s ?? '').replace(/,/g, ';');
}

export default class PerfReporter implements Reporter {
    private records: PerfRecord[] = [];
    private outputDir: string;

    constructor(options?: { outputDir?: string }) {
        this.outputDir = options?.outputDir ?? path.join('test-results', 'perf');
    }

    onBegin(_config: FullConfig, _suite: Suite): void {
        this.records = [];
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        const annotations = Object.fromEntries(
            result.annotations?.map(a => [a.type, a.description ?? '']) ?? []
        );

        const attachmentMap = Object.fromEntries(
            result.attachments?.map(a => [a.name, a.body?.toString() ?? '']) ?? []
        );

        const noteGenMs = attachmentMap['noteGenMs'] || annotations['noteGenMs'] || '';
        let noteGenSec = attachmentMap['noteGenSec'] || annotations['noteGenSec'] || '';
        if (noteGenMs && !noteGenSec) {
            const ms = parseInt(noteGenMs, 10);
            if (!isNaN(ms)) noteGenSec = (ms / 1000).toFixed(3);
        }

        this.records.push({
            suite: test.parent?.title ?? '',
            test: test.title,
            status: result.status,
            startTime: result.startTime.getTime(),
            endTime: result.startTime.getTime() + result.duration,
            durationMs: result.duration,
            baseUrl: attachmentMap['baseUrl'] || annotations['baseUrl'] || '',
            patientName: attachmentMap['patientName'] || annotations['patientName'] || '',
            inputTokens: attachmentMap['inputTokens'] || annotations['inputTokens'] || '',
            outputTokens: attachmentMap['outputTokens'] || annotations['outputTokens'] || '',
            noteGenMs,
            noteGenSec,
            testType: attachmentMap['testType'] || annotations['testType'] || '',
        });
    }

    onEnd(_result: FullResult): void {
        if (this.records.length === 0) {
            console.log('[PerfReporter] No records found.');
            return;
        }

        this.writeCsv();
        this.printSummary();
    }

    private writeCsv(): void {
        fs.mkdirSync(this.outputDir, { recursive: true });
        const csvPath = path.join(this.outputDir, 'perf-results.csv');

        const dateFormat = (ts: number) => new Date(ts).toISOString().replace('T', ' ').replace('Z', '');
        const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

        const header = 'Run ID,Suite,Test,Type,Status,Start Time,End Time,Total Duration (ms),Total Duration (sec),Environment URL,Patient,Input Tokens,Output Tokens,Note Gen Time (ms),Note Gen Time (sec)\n';
        const rows = this.records.map(r => {
            const durSec = (r.durationMs / 1000).toFixed(3);
            return `${runId},${safeCsv(r.suite)},${safeCsv(r.test)},${safeCsv(r.testType)},${r.status},${dateFormat(r.startTime)},${dateFormat(r.endTime)},${r.durationMs},${durSec},${safeCsv(r.baseUrl)},${safeCsv(r.patientName)},${safeCsv(r.inputTokens)},${safeCsv(r.outputTokens)},${safeCsv(r.noteGenMs)},${safeCsv(r.noteGenSec)}`;
        }).join('\n');

        fs.writeFileSync(csvPath, header + rows + '\n');
        console.log(`[PerfReporter] CSV written to: ${csvPath}`);
    }

    private printSummary(): void {
        const durations = this.records.map(r => r.durationMs).sort((a, b) => a - b);
        const p50 = percentile(durations, 0.50);
        const p90 = percentile(durations, 0.90);
        const p95 = percentile(durations, 0.95);
        const p99 = percentile(durations, 0.99);
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const min = durations[0];
        const max = durations[durations.length - 1];

        const fast = durations.filter(d => d <= 30000).length;
        const medium = durations.filter(d => d > 30000 && d <= 60000).length;
        const slow = durations.filter(d => d > 60000).length;
        const pct = (n: number) => ((n * 100) / durations.length).toFixed(2);

        // Break down by test type
        const voiceTests = this.records.filter(r => r.testType === 'voice');
        const convoTests = this.records.filter(r => r.testType === 'conversation');

        console.log('\n========== UI Performance Analysis ==========');
        console.log(`Total Tests: ${durations.length}`);
        if (voiceTests.length > 0) console.log(`  Voice Tests: ${voiceTests.length}`);
        if (convoTests.length > 0) console.log(`  Conversation Tests: ${convoTests.length}`);
        console.log(`Duration Range: ${min}ms - ${max}ms`);
        console.log(`Average Duration: ${avg.toFixed(2)}ms`);
        console.log('\nPerformance Percentiles:');
        console.log(`  P50 (Median): ${p50}ms`);
        console.log(`  P90: ${p90}ms`);
        console.log(`  P95: ${p95}ms`);
        console.log(`  P99: ${p99}ms`);
        console.log('\nPerformance Categories:');
        console.log(`  Fast (<=30s): ${fast} tests (${pct(fast)}%)`);
        console.log(`  Medium (30-60s): ${medium} tests (${pct(medium)}%)`);
        console.log(`  Slow (>60s): ${slow} tests (${pct(slow)}%)`);
        console.log('\nDetailed Report: test-results/perf/perf-results.csv');
        console.log('===============================================\n');
    }
}
