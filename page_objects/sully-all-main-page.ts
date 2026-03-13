import { Page, Locator, expect } from '@playwright/test';

export class SullyAIMainPage {
    readonly page: Page;
    
    // Chat interface elements
    readonly chatTextarea: Locator;
    readonly sendButton: Locator;
    
    // Alternative selectors for robustness
    readonly chatTextareaAlt: Locator;
    readonly sendButtonAlt: Locator;
    
    // Chat conversation elements
    readonly chatMessages: Locator;
    readonly userMessages: Locator;
    readonly aiMessages: Locator;
    readonly latestMessage: Locator;
    
    // Loading and response indicators
    readonly loadingIndicator: Locator;
    readonly typingIndicator: Locator;
    readonly responseContainer: Locator;
    
    // Page elements
    readonly mainContainer: Locator;
    readonly chatContainer: Locator;
    readonly errorMessage: Locator;
    readonly closeButton: Locator;
    
    // Cookie/Privacy banner elements
    readonly cookieBanner: Locator;
    readonly acceptAllButton: Locator;
    
    // Patient search elements
    readonly patientSearchDropdown: Locator;
    readonly patientSearchInput: Locator;
    readonly patientDropdownOptions: Locator;
    
    // Voice recording elements
    readonly recordButton: Locator;
    readonly stopRecordingButton: Locator;
    readonly generateNoteButton: Locator;
    
    // Additional notes elements
    readonly addNotesButton: Locator;
    readonly additionalNotesTextarea: Locator;
    
    // View Note elements
    readonly viewNoteButton: Locator;
    readonly noteItemTitle: Locator;
    readonly noteEditor: Locator;
    readonly startInPersonVisitButton: Locator;

    // Patients list / deletion elements
    readonly patientsButton: Locator;
    readonly patientsListSearchInput: Locator;
    readonly patientRowMenuToggle: Locator;
    readonly deletePatientOption: Locator;
    readonly confirmOkButton: Locator;

    constructor(page: Page) {
        this.page = page;
        
        // Primary selectors based on provided HTML
        this.chatTextarea = page.locator('#twid_chat_input_textarea');
        this.sendButton = page.locator('#twid_chat_input_send');
        
        // Alternative selectors for robustness
        this.chatTextareaAlt = page.locator('textarea[aria-expanded], textarea.tw-w-full');
        this.sendButtonAlt = page.locator('button:has(svg), button[class*="tw-bg-blue"]');
        
        // Chat conversation elements
        this.chatMessages = page.locator('.chat-message');
        this.userMessages = page.locator('.chat-message').filter({ hasNotText: 'SOURCES:' }).first();
        this.aiMessages = page.locator('.chat-message.copy-target');
        this.latestMessage = page.locator('.chat-message').last();
        
        // Loading and response indicators
        this.loadingIndicator = page.locator('.loading, .spinner, [aria-label="Loading"]');
        this.typingIndicator = page.locator('text="typing..."').or(page.locator('.typing')).or(page.locator('[data-testid*="typing"]')).or(page.locator('.chat-message:has-text("typing...")'));
        this.responseContainer = page.locator('.response, .ai-response, .assistant-response');
        
        // Page elements
        this.mainContainer = page.locator('main, .main-content, .app-content');
        this.chatContainer = page.locator('.chat-container, .conversation, .chat-interface');
        this.errorMessage = page.locator('.error, .alert-danger, [role="alert"]');
        this.closeButton = page.locator('button[aria-label="Close"][data-pc-section="closebutton"]');
        
        // Cookie/Privacy banner elements
        this.cookieBanner = page.locator('text="We value your privacy"').or(page.locator('.cookie-banner')).or(page.locator('[role="dialog"]'));
        this.acceptAllButton = page.getByRole('button', { name: 'Accept All' });
        
        // Patient search elements
        this.patientSearchDropdown = page.locator('input[role="combobox"][placeholder*="Search or create patient"]');
        this.patientSearchInput = page.locator('input[role="combobox"][placeholder*="Search or create patient"]');
        this.patientDropdownOptions = page.locator('li[role="option"]');
        
        // Voice recording elements
        this.recordButton = page.locator('button:has-text("Start In-Person Visit"), button:has-text("Start")').first();
        this.stopRecordingButton = page.locator('span.tw-font-medium:has-text("Recording (Click to Pause)")').first();
        this.generateNoteButton = page.locator('button#twid_generate_note_button');
        
        // Additional notes elements
        this.addNotesButton = page.locator('button#twid_scribe_additional_notes');
        this.additionalNotesTextarea = page.locator('textarea[placeholder="Type additional notes here"]');
        
        // View Note elements
        this.viewNoteButton = page.locator('button:has-text("View Note")');
        this.noteItemTitle = page.locator('#note-item-head-title');
        this.noteEditor = page.locator('div.tiptap.ProseMirror[role="textbox"]');
        this.startInPersonVisitButton = page.getByRole('button', { name: /Start In-Person Visit/i });

        // Patients list / deletion elements
        this.patientsButton = page.locator('button:has(span:text("Patients"))');
        this.patientsListSearchInput = page.locator('input#twid_search_patient, input[data-testid="patients-list-screen__patient-list-view--v2__patient-search-header--v2__patient-search--v2__input--search"]');
        this.patientRowMenuToggle = page.locator('div[data-testid="patients-list-screen__patient-list-view--v2__patient-list-table--v2__patient-group--v2__patient-group-items--v2__patient-row--v2__patient-row-dropdown--v2__button--toggle"]');
        this.deletePatientOption = page.locator('div[data-testid="patients-list-screen__patient-list-view--v2__patient-list-table--v2__patient-group--v2__patient-group-items--v2__patient-row--v2__patient-row-dropdown--v2__option--delete"]');
        this.confirmOkButton = page.locator('button[data-slot="button"]:text("OK")');
    }

    /**
     * Wait for the main chat page to be ready
     */
    async waitForChatPageReady(): Promise<void> {
        console.log('⏳ Waiting for chat page to be ready...');
        
        // Wait for either primary or alternative textarea to be visible
        try {
            await Promise.race([
                this.chatTextarea.waitFor({ state: 'visible', timeout: 15000 }),
                this.chatTextareaAlt.waitFor({ state: 'visible', timeout: 15000 })
            ]);
            console.log('✅ Chat page is ready');
        } catch (error) {
            console.log('⚠️ Chat interface not immediately visible, taking screenshot for debugging');
            await this.page.screenshot({ path: 'chat-page-debug.png' });
            throw new Error('Chat page did not load properly');
        }
    }

    /**
     * Enter text in the chat textarea
     */
    async enterChatMessage(message: string): Promise<void> {
        console.log(`💬 Entering chat message: "${message}"`);
        
        // Try primary selector first, then fallback
        try {
            await this.chatTextarea.waitFor({ state: 'visible', timeout: 5000 });
            await this.chatTextarea.clear();
            await this.chatTextarea.fill(message);
        } catch {
            console.log('💬 Using alternative chat textarea selector...');
            await this.chatTextareaAlt.first().waitFor({ state: 'visible' });
            await this.chatTextareaAlt.first().clear();
            await this.chatTextareaAlt.first().fill(message);
        }
        
        // Verify message was entered
        const textareaValue = await this.getChatInputValue();
        if (!textareaValue.includes(message)) {
            throw new Error(`Failed to enter message. Expected: "${message}", Got: "${textareaValue}"`);
        }
        console.log('✅ Chat message entered successfully');
    }

    /**
     * Click the send button to send the message
     */
    async clickSendButton(): Promise<void> {
        console.log('📤 Clicking send button...');
        
        // Try primary selector first, then fallback
        try {
            await this.sendButton.waitFor({ state: 'visible', timeout: 5000 });
            await this.sendButton.click();
        } catch {
            console.log('📤 Using alternative send button selector...');
            await this.sendButtonAlt.first().waitFor({ state: 'visible' });
            await this.sendButtonAlt.first().click();
        }
        console.log('✅ Send button clicked');
    }

    /**
     * Send a complete chat message (enter text + click send)
     */
    async sendChatMessage(message: string): Promise<void> {
        console.log(`🚀 Sending chat message: "${message}"`);
        
        await this.enterChatMessage(message);
        await this.clickSendButton();
        
        console.log('✅ Chat message sent');
    }

    /**
     * Wait for AI response to appear
     */
    async waitForAIResponse(timeout: number = 30000): Promise<void> {
        console.log('⏳ Waiting for AI response...');
        
        try {
            // Step 1: Wait for typing indicator to appear (AI started processing)
            console.log('🔍 Looking for typing indicator...');
            const typingAppeared = await this.typingIndicator.first().waitFor({ 
                state: 'visible', 
                timeout: 10000 
            }).then(() => true).catch(() => false);
            
            if (typingAppeared) {
                console.log('👀 Typing indicator found, waiting for it to disappear...');
                
                // Step 2: Wait for typing indicator to disappear (AI finished processing)
                await this.typingIndicator.first().waitFor({ 
                    state: 'hidden', 
                    timeout: timeout 
                });
                console.log('✅ Typing indicator disappeared');
            } else {
                console.log('⚠️ No typing indicator found, continuing...');
            }
            
            // Step 3: Wait for the actual AI response element to appear
            console.log('🔍 Waiting for AI response element...');
            await this.aiMessages.first().waitFor({ state: 'visible', timeout: 15000 });
            
            // Step 4: Wait for the response to be complete (when timestamp appears)
            console.log('🔍 Waiting for response completion (timestamp)...');
            await this.page.locator('.time-stamp').first().waitFor({ state: 'visible', timeout: 10000 });
            
            // Step 5: Give a moment for content to stabilize
            await this.page.waitForTimeout(2000);
            
            console.log('✅ AI response is ready');
            
        } catch (error) {
            console.log(`⚠️ Timeout waiting for AI response: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get the latest AI response text
     */
    async getLatestAIResponse(): Promise<string> {
        console.log('📖 Getting latest AI response...');
        
        try {
            // Wait for AI response to be visible
            await this.aiMessages.first().waitFor({ state: 'visible', timeout: 5000 });
            
            // Get the text content from the AI response
            const aiResponseElement = this.aiMessages.first();
            const responseText = await aiResponseElement.textContent();
            
            if (responseText && responseText.trim().length > 0) {
                // Make sure we didn't capture typing indicator text
                const cleanedResponse = responseText.trim();
                if (cleanedResponse.toLowerCase().includes('typing') && cleanedResponse.length < 20) {
                    console.log('⚠️ Detected typing indicator text, waiting longer for actual response...');
                    await this.page.waitForTimeout(5000);
                    
                    // Try again to get the response
                    const retryResponseText = await aiResponseElement.textContent();
                    if (retryResponseText && retryResponseText.trim().length > 20) {
                        console.log(`✅ Found AI response (retry): "${retryResponseText.substring(0, 100)}..."`);
                        return retryResponseText.trim();
                    }
                }
                
                console.log(`✅ Found AI response: "${cleanedResponse.substring(0, 100)}..."`);
                return cleanedResponse;
            } else {
                console.log('⚠️ AI response element found but no text content');
                return '';
            }
            
        } catch (error) {
            console.log(`⚠️ Could not retrieve AI response: ${error.message}`);
            return '';
        }
    }

    /**
     * Get current chat input value
     */
    async getChatInputValue(): Promise<string> {
        try {
            return await this.chatTextarea.inputValue();
        } catch {
            return await this.chatTextareaAlt.first().inputValue();
        }
    }

    /**
     * Check if send button is enabled
     */
    async isSendButtonEnabled(): Promise<boolean> {
        try {
            const isEnabled = await this.sendButton.isEnabled();
            return isEnabled;
        } catch {
            const isEnabled = await this.sendButtonAlt.first().isEnabled();
            return isEnabled;
        }
    }

    /**
     * Verify chat interface elements are present
     */
    async verifyChatElements(): Promise<void> {
        console.log('🔍 Verifying chat interface elements...');
        
        await expect(this.chatTextarea.or(this.chatTextareaAlt)).toBeVisible();
        await expect(this.sendButton.or(this.sendButtonAlt)).toBeVisible();
        
        console.log('✅ All chat interface elements are present');
    }

    /**
     * Check for any error messages in the chat
     */
    async getChatError(): Promise<string | null> {
        try {
            const errorVisible = await this.errorMessage.isVisible();
            if (errorVisible) {
                const errorText = await this.errorMessage.textContent();
                return errorText?.trim() || null;
            }
        } catch {
            // No error found
        }
        return null;
    }

    /**
     * Take screenshot for debugging
     */
    async takeScreenshot(name: string = 'chat-debug'): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath = `screenshots/${name}-${timestamp}.png`;
        await this.page.screenshot({ path: filePath });
        console.log(`📸 Screenshot saved: ${filePath}`);
    }

    /**
     * Get all visible chat messages
     */
    async getAllChatMessages(): Promise<string[]> {
        console.log('📜 Getting all chat messages...');
        
        const messages: string[] = [];
        const messageElements = await this.chatMessages.all();
        
        for (const messageEl of messageElements) {
            const isVisible = await messageEl.isVisible().catch(() => false);
            if (isVisible) {
                const text = await messageEl.textContent();
                if (text?.trim()) {
                    messages.push(text.trim());
                }
            }
        }
        
        console.log(`📜 Found ${messages.length} chat messages`);
        return messages;
    }

    /**
     * Wait for the chat input to be ready for input
     */
    async waitForChatInputReady(): Promise<void> {
        console.log('⏳ Waiting for chat input to be ready...');
        
        // Wait for textarea to be visible and enabled
        await this.chatTextarea.or(this.chatTextareaAlt).waitFor({ state: 'visible' });
        
        // Ensure it's enabled and can accept input
        const isEnabled = await this.isChatInputEnabled();
        if (!isEnabled) {
            throw new Error('Chat input is not enabled');
        }
        
        console.log('✅ Chat input is ready');
    }

    /**
     * Check if chat input is enabled
     */
    async isChatInputEnabled(): Promise<boolean> {
        try {
            const isEnabled = await this.chatTextarea.isEnabled();
            return isEnabled;
        } catch {
            const isEnabled = await this.chatTextareaAlt.first().isEnabled();
            return isEnabled;
        }
    }

    /**
     * Clear the chat input
     */
    async clearChatInput(): Promise<void> {
        console.log('🧹 Clearing chat input...');
        
        try {
            await this.chatTextarea.clear();
        } catch {
            await this.chatTextareaAlt.first().clear();
        }
        
        console.log('✅ Chat input cleared');
    }

    /**
     * Type message with human-like delay
     */
    async typeMessageSlowly(message: string, delayMs: number = 100): Promise<void> {
        console.log(`⌨️ Typing message slowly: "${message}"`);
        
        await this.clearChatInput();
        
        // Type character by character
        for (const char of message) {
            try {
                await this.chatTextarea.type(char);
            } catch {
                await this.chatTextareaAlt.first().type(char);
            }
            await this.page.waitForTimeout(delayMs);
        }
        
        console.log('✅ Message typed slowly');
    }

    /**
     * Dismiss cookie/privacy banner if it appears
     */
    async dismissCookieBanner(): Promise<void> {
        console.log('🍪 Checking for cookie/privacy banner...');

        try {
            // short settle
            await this.page.waitForTimeout(1000);
            const visible = await this.acceptAllButton.isVisible().catch(() => false);
            if (visible) {
                await this.acceptAllButton.click();
                console.log('✅ Cookie banner dismissed');
            } else {
                console.log('🍪 No cookie banner visible');
            }
        } catch {
            console.log('⚠️ Cookie banner dismissal skipped');
        }
                
    }

    /**
     * Click on the patient search dropdown to open it
     */
    async clickPatientSearchDropdown(): Promise<void> {
        console.log('🔍 Clicking patient search dropdown...');
        
        try {
            // Wait for the dropdown input to be visible
            await this.patientSearchDropdown.waitFor({ state: 'visible', timeout: 10000 });
            
            // Click on the dropdown input
            await this.patientSearchDropdown.click();
            
            console.log('✅ Patient search dropdown clicked');
            
        } catch (error) {
            console.log(`⚠️ Could not click patient search dropdown: ${error.message}`);
            await this.takeScreenshot('patient-dropdown-click-failed');
            throw error;
        }
    }

    /**
     * Search for a patient by name and select it
     */
    async searchAndSelectPatient(patientName: string): Promise<void> {
        console.log(`👤 Searching for patient: "${patientName}"`);
        
        try {
            // Type the patient name in the search input
            await this.patientSearchInput.fill(patientName);
            console.log(`✅ Typed patient name: "${patientName}"`);
            
            // Wait for dropdown options to appear
            await this.page.waitForTimeout(2000);
            
            // Look for the specific patient option and click it
            const patientOption = this.patientDropdownOptions.filter({ hasText: patientName });
            await patientOption.first().waitFor({ state: 'visible', timeout: 10000 });
            
            // Click on the patient option
            await patientOption.first().click();
            
            console.log(`✅ Selected patient: "${patientName}"`);
            
        } catch (error) {
            console.log(`⚠️ Could not search and select patient "${patientName}": ${error.message}`);
            await this.takeScreenshot('patient-selection-failed');
            throw error;
        }
    }

    /**
     * Click the close (X) button on any overlay/dialog if present
     */
    async clickCloseButton(): Promise<void> {
        console.log('❎ Attempting to click close button...');
        const isVisible = await this.closeButton.isVisible().catch(() => false);
        if (!isVisible) {
            console.log('❎ Close button not visible; skipping');
            return;
        }
        try {
            await this.closeButton.click({ trial: false });
            console.log('✅ Close button clicked');
        } catch (error) {
            console.log(`⚠️ Close button click failed: ${error.message}`);
        }
    }

    /**
     * Handle microphone permission popup
     */
    async handleMicrophonePermission(): Promise<void> {
        console.log('🎤 Handling microphone permission...');
        
        try {
            // Grant microphone permission using context
            await this.page.context().grantPermissions(['microphone']);
            console.log('✅ Microphone permission granted');
            
        } catch (error) {
            console.log(`⚠️ Could not grant microphone permission: ${error.message}`);
            // This might be handled by browser flags instead
        }
    }

    /**
     * Record audio using fake audio file for a specified duration (default 2 minutes)
     */
    async recordAudio(durationMs: number = 120000): Promise<void> {
        console.log('🎙️ Starting audio recording...');
        try {
            // Record for desired duration (default 120000ms = 2 minutes)
            await this.page.waitForTimeout(durationMs);

            // Try to stop recording by clicking the wave container or stop button
            const stopVisible = await this.stopRecordingButton.isVisible({ timeout: 5000 }).catch(() => false);
            if (stopVisible) {
                await this.stopRecordingButton.click();
                console.log('⏹️ Recording stopped');
            } else {
                console.log('⚠️ Stop recording button/wave not found; proceeding to finish');
            }

            await this.page.waitForTimeout(2000);
            console.log('✅ Audio recording completed');
        } catch (error) {
            console.log(`⚠️ Could not record audio: ${(error as Error).message}`);
            await this.takeScreenshot('audio-recording-failed');
            throw error;
        }
    }

    /**
     * Click the Generate Note button
     */
    async clickGenerateNote(): Promise<void> {
        console.log('📝 Clicking Generate Note button...');
        
        try {
            // Wait for the button to be visible and enabled
            await this.generateNoteButton.waitFor({ state: 'visible', timeout: 10000 });
            
            // Check if button is enabled
            const isEnabled = await this.generateNoteButton.isEnabled();
            if (!isEnabled) {
                console.log('⚠️ Generate Note button is not enabled yet, waiting...');
                await this.page.waitForTimeout(3000);
            }
            
            // Click the button
            await this.generateNoteButton.click();
            
            console.log('✅ Generate Note button clicked');
            
        } catch (error) {
            console.log(`⚠️ Could not click Generate Note button: ${error.message}`);
            await this.takeScreenshot('generate-note-failed');
            throw error;
        }
    }

    /**
     * Click the Add Notes button
     */
    async clickAddNotesButton(): Promise<void> {
        console.log('📝 Clicking Add Notes button...');
        
        try {
            // Wait for the button to be visible and enabled
            await this.addNotesButton.waitFor({ state: 'visible', timeout: 10000 });
            
            // Check if button is enabled
            const isEnabled = await this.addNotesButton.isEnabled();
            if (!isEnabled) {
                console.log('⚠️ Add Notes button is not enabled yet, waiting...');
                await this.page.waitForTimeout(3000);
            }
            
            // Click the button
            await this.addNotesButton.click();
            
            console.log('✅ Add Notes button clicked');
            
        } catch (error) {
            console.log(`⚠️ Could not click Add Notes button: ${error.message}`);
            await this.takeScreenshot('add-notes-failed');
            throw error;
        }
    }

    /**
     * Fill the additional notes textarea with provided text
     */
    async fillAdditionalNotes(notes: string): Promise<void> {
        console.log('📝 Filling additional notes...');
        await this.additionalNotesTextarea.waitFor({ state: 'visible', timeout: 10000 });
        await this.additionalNotesTextarea.fill(notes);
        console.log('✅ Additional notes filled');
    }

    /**
     * Click the View Note button
     */
    async clickViewNoteButton(): Promise<void> {
        console.log('📄 Clicking View Note button...');
        
        try {
            // Wait for the button to be visible and enabled
            await this.viewNoteButton.waitFor({ state: 'visible', timeout: 10000 });
            
            // Check if button is enabled
            const isEnabled = await this.viewNoteButton.isEnabled();
            if (!isEnabled) {
                console.log('⚠️ View Note button is not enabled yet, waiting...');
                await this.page.waitForTimeout(3000);
            }
            
            // Click the button
            await this.viewNoteButton.click();
            
            console.log('✅ View Note button clicked');
            
        } catch (error) {
            console.log(`⚠️ Could not click View Note button: ${error.message}`);
            await this.takeScreenshot('view-note-failed');
            throw error;
        }
    }

    /**
     * Click Start In-Person Visit button
     */
    async clickStartInPersonVisit(): Promise<void> {
        console.log('🏁 Clicking Start In-Person Visit...');
        await this.startInPersonVisitButton.waitFor({ state: 'visible', timeout: 15000 });
        await this.startInPersonVisitButton.click();
        console.log('✅ Start In-Person Visit clicked');
    }

    /**
     * Wait for and click the note item matching patient name
     */
    async waitForAndClickNoteItem(patientName: string, timeoutMs: number = 150000): Promise<void> {
        console.log(`🕒 Waiting for note item for: "${patientName}"`);
        const end = Date.now() + timeoutMs;

        // Optional: wait a bit for "processing" messages to appear and then disappear
        await this.page.waitForTimeout(1000);

        // Poll for note item title containing patient name
        while (Date.now() < end) {
            const el = this.noteItemTitle.filter({ hasText: new RegExp(patientName, 'i') }).first();
            const visible = await el.isVisible().catch(() => false);
            if (visible) {
                await el.click();
                console.log('✅ Note item clicked');
                return;
            }
            await this.page.waitForTimeout(1000);
        }
        await this.takeScreenshot('note-item-wait-timeout');
        throw new Error(`Timed out waiting for note item for "${patientName}"`);
    }

    /**
     * Wait until the note editor is non-empty
     */
    async waitUntilNoteEditorNotEmpty(timeoutMs: number = 120000): Promise<void> {
        console.log('🕒 Waiting for note editor content...');
        await this.noteEditor.waitFor({ state: 'visible', timeout: 30000 });
        const end = Date.now() + timeoutMs;
        while (Date.now() < end) {
            const text = (await this.noteEditor.textContent())?.trim() || '';
            if (text.length > 0) {
                await this.page.waitForTimeout(750);
                console.log('✅ Note editor has content');
                return;
            }
            await this.page.waitForTimeout(1000);
        }
        await this.takeScreenshot('note-editor-empty-timeout');
        throw new Error('Timed out waiting for note editor content');
    }

    /**
     * Get note editor text
     */
    async getNoteEditorText(): Promise<string> {
        await this.noteEditor.waitFor({ state: 'visible', timeout: 30000 });
        return (await this.noteEditor.textContent())?.trim() || '';
    }

    /**
     * Navigate to the Patients list view
     */
    async clickPatientsButton(): Promise<void> {
        console.log('👥 Clicking Patients button...');
        await this.patientsButton.waitFor({ state: 'visible', timeout: 15000 });
        await this.patientsButton.click();
        await this.page.waitForTimeout(1500);
        console.log('✅ Patients button clicked');
    }

    /**
     * Search for a patient in the patients list
     */
    async searchInPatientsList(patientName: string): Promise<void> {
        console.log(`🔍 Searching patients list for: "${patientName}"`);
        try {
            await this.patientsListSearchInput.waitFor({ state: 'visible', timeout: 10000 });
            await this.patientsListSearchInput.click();
            await this.patientsListSearchInput.clear();
            await this.patientsListSearchInput.fill(patientName);
            await this.page.waitForTimeout(1000);
            console.log('✅ Patients list search completed');
        } catch (error) {
            console.log(`⚠️ Patients list search failed: ${(error as Error).message}`);
        }
    }

    /**
     * Delete a patient by name from the patients list.
     * Navigates to Patients, searches, opens row menu, clicks Delete, confirms.
     */
    async deletePatient(patientName: string): Promise<void> {
        console.log(`🗑️ Deleting patient: "${patientName}"`);

        await this.clickPatientsButton();
        await this.searchInPatientsList(patientName);

        try {
            await this.patientRowMenuToggle.first().waitFor({ state: 'visible', timeout: 10000 });
            await this.patientRowMenuToggle.first().click();
            await this.page.waitForTimeout(1000);

            await this.deletePatientOption.waitFor({ state: 'visible', timeout: 5000 });
            await this.deletePatientOption.click();
            await this.page.waitForTimeout(1000);

            await this.confirmOkButton.waitFor({ state: 'visible', timeout: 5000 });
            await this.confirmOkButton.click();
            await this.page.waitForTimeout(1000);

            console.log(`✅ Patient "${patientName}" deleted`);
        } catch (error) {
            console.log(`⚠️ Patient deletion failed: ${(error as Error).message}`);
            await this.takeScreenshot('patient-delete-failed');
        }
    }
}