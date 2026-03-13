import { test, expect } from '@playwright/test';
import { SullyAILoginPage } from '../page_objects/sully-all-login-page';
import { SullyAIMainPage } from '../page_objects/sully-all-main-page';
import { getBaseUrl, printEnvironmentInfo } from '../environment';
import { getRandomPatientName, estimateTokens } from '../utils/patient-names';
import { loadRandomConversation } from '../utils/conversation-loader';

const INVOCATION_COUNT = parseInt(process.env.INVOCATIONS || '3', 10);

test.describe('Sully AI Conversation Load Test', () => {
    test.beforeAll(async () => {
        printEnvironmentInfo();
    });

    for (let i = 0; i < INVOCATION_COUNT; i++) {
        test(`conversation note generation - invocation ${i + 1}`, async ({ page }) => {
            const loginPage = new SullyAILoginPage(page);
            const mainPage = new SullyAIMainPage(page);
            const patientName = getRandomPatientName();
            const baseUrl = getBaseUrl();

            // Attach metadata for the perf reporter
            test.info().annotations.push(
                { type: 'testType', description: 'conversation' },
                { type: 'patientName', description: patientName },
                { type: 'baseUrl', description: baseUrl },
            );

            console.log(`Starting conversation load test for patient: ${patientName}`);

            // Step 1: Login
            console.log('Step 1: Performing login...');
            await loginPage.navigateToLogin();
            await loginPage.waitForLoginPageReady();
            await loginPage.loginWithTestCredentials();
            await loginPage.waitForNavigation(10000);

            // Step 2: Dismiss overlays
            console.log('Step 2: Waiting for main page...');
            await page.waitForTimeout(3000);
            await mainPage.clickCloseButton();

            // Step 3: Open patient search
            console.log('Step 3: Opening patient search...');
            await mainPage.clickPatientSearchDropdown();

            // Step 4: Search and select patient
            console.log(`Step 4: Selecting patient "${patientName}"...`);
            await mainPage.searchAndSelectPatient(patientName);

            // Step 5: Start In-Person Visit
            console.log('Step 5: Starting In-Person Visit...');
            await mainPage.clickStartInPersonVisit();
            await page.waitForTimeout(3000);

            // Step 6: Click Add Notes and enter conversation text
            console.log('Step 6: Adding conversation notes...');
            await mainPage.clickAddNotesButton();
            await page.waitForTimeout(1000);

            const conversationText = loadRandomConversation();
            const inputTokens = estimateTokens(conversationText);
            test.info().annotations.push({ type: 'inputTokens', description: String(inputTokens) });

            await mainPage.fillAdditionalNotes(conversationText);
            await page.waitForTimeout(1000);

            // Step 7: Click Finish Visit (Generate Note)
            console.log('Step 7: Clicking Finish Visit / Generate Note...');
            const noteGenStartMs = Date.now();
            await mainPage.clickGenerateNote();
            await page.waitForTimeout(7000);

            // Step 8: Click View Note
            console.log('Step 8: Clicking View Note...');
            await mainPage.clickViewNoteButton();
            await page.waitForTimeout(1000);

            // Step 9: Wait for note content
            console.log('Step 9: Waiting for note content...');
            await mainPage.waitUntilNoteEditorNotEmpty();

            const noteText = await mainPage.getNoteEditorText();
            const noteGenMs = Math.max(0, Date.now() - noteGenStartMs);
            const outputTokens = estimateTokens(noteText);

            test.info().annotations.push(
                { type: 'outputTokens', description: String(outputTokens) },
                { type: 'noteGenMs', description: String(noteGenMs) },
            );

            console.log(`Note characters: ${noteText.length}, output tokens: ${outputTokens}`);
            console.log(`Note generation time: ${noteGenMs}ms (${(noteGenMs / 1000).toFixed(3)}s)`);

            expect(noteText.length).toBeGreaterThan(0);

            // Step 10: Delete the patient
            console.log(`Step 10: Deleting patient "${patientName}"...`);
            await mainPage.deletePatient(patientName);
            await page.waitForTimeout(2000);

            console.log('Conversation load test completed successfully!');
        });
    }
});
