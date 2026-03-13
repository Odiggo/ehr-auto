import { test, expect } from '@playwright/test';
import { SullyAILoginPage } from '../page_objects/sully-all-login-page';
import { SullyAIMainPage } from '../page_objects/sully-all-main-page';
import { getBaseUrl, printEnvironmentInfo } from '../environment';
import { getRandomPatientName } from '../utils/patient-names';
import { chromium } from '@playwright/test';

const RECORDING_DURATION_MS = parseInt(process.env.RECORDING_DURATION || '120000', 10);

test.describe('Sully AI Voice Recording Load Test', () => {
    test.beforeAll(async () => {
        printEnvironmentInfo();
    });

    test('should login, record audio, and generate note', async ({  }) => {
        console.log('Starting voice recording workflow...');
        const browser = await chromium.launch({
            args: [
              '--use-fake-ui-for-media-stream',
              '--use-fake-device-for-media-stream',
              '--use-file-for-fake-audio-capture=./doctersounds/record.wav'
            ],
          });

        try {
            const context = await browser.newContext({
                permissions: ['microphone'],
            });
            const page = await context.newPage();

            const loginPage = new SullyAILoginPage(page);
            const mainPage = new SullyAIMainPage(page);
            const patientName = getRandomPatientName();
            const baseUrl = getBaseUrl();

            test.info().annotations.push(
                { type: 'testType', description: 'voice' },
                { type: 'patientName', description: patientName },
                { type: 'baseUrl', description: baseUrl },
            );

            // Step 1: Login
            console.log('Step 1: Performing login...');
            await loginPage.navigateToLogin();
            await loginPage.waitForLoginPageReady();
            await loginPage.loginWithTestCredentials();
            await loginPage.waitForNavigation(10000);

            // Step 2: Wait for main page and close any overlays
            console.log('Step 2: Waiting for main page...');
            await page.waitForTimeout(3000);
            await mainPage.clickCloseButton();

            // Step 3: Click patient search dropdown
            console.log('Step 3: Opening patient search dropdown...');
            await mainPage.clickPatientSearchDropdown();

            // Step 4: Search and select patient by name
            console.log(`Step 4: Selecting patient "${patientName}"...`);
            await mainPage.searchAndSelectPatient(patientName);

            // Step 5: Handle microphone permission
            console.log('Step 5: Handling microphone permission...');
            await mainPage.handleMicrophonePermission();

            // Step 6: Click Start In-Person Visit button
            console.log('Step 6: Clicking Start In-Person Visit...');
            await mainPage.clickStartInPersonVisit();
            await page.waitForTimeout(3000);

            // Step 7: Record audio
            console.log(`Step 7: Recording audio for ${RECORDING_DURATION_MS / 1000}s...`);
            const noteGenStartMs = Date.now();
            await mainPage.recordAudio(RECORDING_DURATION_MS);
            await mainPage.takeScreenshot('before-generate-note');

            // Step 8: Click Generate Note
            console.log('Step 8: Clicking Generate Note...');
            await mainPage.clickGenerateNote();

            // Step 9: Click View Note button
            console.log('Step 9: Clicking View Note...');
            await mainPage.clickViewNoteButton();

            // Step 10: Wait for patient note item and open it
            console.log('Step 10: Selecting generated note item...');
            await mainPage.waitForAndClickNoteItem(patientName);

            // Step 11: Verify note content is generated
            console.log('Step 11: Verifying note content...');
            await mainPage.waitUntilNoteEditorNotEmpty();

            const noteText = await mainPage.getNoteEditorText();
            const noteGenMs = Math.max(0, Date.now() - noteGenStartMs);

            test.info().annotations.push(
                { type: 'noteGenMs', description: String(noteGenMs) },
            );

            expect(noteText.length).toBeGreaterThan(0);

            // Step 12: Final screenshot
            console.log('Step 12: Final screenshot...');
            await page.waitForTimeout(3000);
            await mainPage.takeScreenshot('after-generate-note');

            console.log(`Voice recording workflow completed! Note gen time: ${noteGenMs}ms`);
        } finally {
            await browser.close();
        }
    });
});
