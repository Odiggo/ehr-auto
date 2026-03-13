import { Page, Locator, expect } from '@playwright/test';
import { getBaseUrl } from '../environment';

export class SullyAILoginPage {
    readonly page: Page;
    
    // Login form elements
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    
    // Alternative selectors (fallbacks)
    readonly emailInputAlt: Locator;
    readonly passwordInputAlt: Locator;
    readonly loginButtonAlt: Locator;
    
    // Page elements
    readonly pageContainer: Locator;
    readonly errorMessage: Locator;
    readonly loadingIndicator: Locator;
    readonly mainContainer: Locator;
    
    // Cookie/Privacy banner elements
    readonly cookieBanner: Locator;
    readonly acceptAllButton: Locator;

    constructor(page: Page) {
        this.page = page;
        
        // Primary selectors based on provided HTML
        this.emailInput = page.locator('input[name="email"][placeholder="Email"]');
        this.passwordInput = page.locator('input[name="password"][placeholder="Password"][type="password"]');
        this.loginButton = page.locator('button[type="submit"]:has-text("Login")');
        
        // Alternative selectors for robustness
        this.emailInputAlt = page.locator('input[name="email"], input[type="email"]');
        this.passwordInputAlt = page.locator('input[name="password"], input[type="password"]');
        this.loginButtonAlt = page.locator('button:has-text("Login"), button[type="submit"]');
        
        // Page elements
        this.pageContainer = page.locator('body, main, .container');
        this.errorMessage = page.locator('.error, .alert-danger, [role="alert"]');
        this.loadingIndicator = page.locator('.loading, .spinner, [aria-label="Loading"]');
        this.mainContainer = page.locator('body, main, .container');
        
        // Cookie/Privacy banner elements
        this.cookieBanner = page.locator('text="We value your privacy"').or(page.locator('.cookie-banner')).or(page.locator('[role="dialog"]'));
        this.acceptAllButton = page.getByRole('button', { name: 'Accept All' });
    }

    /**
     * Navigate to the login page
     */
    async navigateToLogin(): Promise<void> {
        console.log('🌐 Navigating to Sully AI login page...');
        
        const baseUrl = getBaseUrl();
        await this.page.goto(baseUrl);
        console.log(`✅ Navigated to: ${this.page.url()}`);
        
        // Dismiss cookie banner if it appears
        await this.dismissCookieBanner();
    }

    /**
     * Dismiss cookie/privacy banner if it appears
     */
    async dismissCookieBanner(): Promise<void> {
        console.log('🍪 Checking for cookie/privacy banner on login page...');
        
        try {
            // Wait a moment for banner to appear
            await this.page.waitForTimeout(2000);
            
            // Check if cookie banner is visible
            const bannerVisible = await this.cookieBanner.isVisible({ timeout: 5000 });
            
            if (bannerVisible) {
                console.log('🍪 Cookie banner found on login page, dismissing...');
                
                // Click Accept All to dismiss the banner
                await this.acceptAllButton.click({ timeout: 5000 });
                
                // Wait for banner to disappear
                await this.cookieBanner.waitFor({ state: 'hidden', timeout: 5000 });
                
                console.log('✅ Cookie banner dismissed successfully on login page');
            } else {
                console.log('🍪 No cookie banner found on login page');
            }
            
        } catch (error) {
            console.log(`⚠️ Could not dismiss cookie banner on login page: ${error.message}`);
            // Don't fail the test if banner dismissal fails
        }
    }

    /**
     * Wait for login page to be ready
     */
    async waitForLoginPageReady(): Promise<void> {
        console.log('⏳ Waiting for login page to be ready...');
        
        // Wait for either primary or alternative email input to be visible
        try {
            await Promise.race([
                this.emailInput.waitFor({ state: 'visible', timeout: 10000 }),
                this.emailInputAlt.waitFor({ state: 'visible', timeout: 10000 })
            ]);
            console.log('✅ Login page is ready');
        } catch (error) {
            console.log('⚠️ Login form not immediately visible, taking screenshot for debugging');
            await this.page.screenshot({ path: 'login-page-debug.png' });
            throw new Error('Login page did not load properly');
        }
    }

    /**
     * Enter email in the email field
     */
    async enterEmail(email: string): Promise<void> {
        console.log(`📧 Entering email: ${email}`);
        
        // Try primary selector first, then fallback
        try {
            await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
            await this.emailInput.clear();
            await this.emailInput.fill(email);
        } catch {
            console.log('📧 Using alternative email selector...');
            await this.emailInputAlt.first().waitFor({ state: 'visible' });
            await this.emailInputAlt.first().clear();
            await this.emailInputAlt.first().fill(email);
        }
        
        // Verify email was entered
        const emailValue = await this.getEmailValue();
        if (!emailValue.includes(email)) {
            throw new Error(`Failed to enter email. Expected: ${email}, Got: ${emailValue}`);
        }
        console.log('✅ Email entered successfully');
    }

    /**
     * Enter password in the password field
     */
    async enterPassword(password: string): Promise<void> {
        console.log('🔒 Entering password...');
        
        // Try primary selector first, then fallback
        try {
            await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
            await this.passwordInput.clear();
            await this.passwordInput.fill(password);
        } catch {
            console.log('🔒 Using alternative password selector...');
            await this.passwordInputAlt.first().waitFor({ state: 'visible' });
            await this.passwordInputAlt.first().clear();
            await this.passwordInputAlt.first().fill(password);
        }
        
        // Verify password was entered (check if field has value, don't reveal password)
        const hasPassword = await this.hasPasswordValue();
        if (!hasPassword) {
            throw new Error('Failed to enter password');
        }
        console.log('✅ Password entered successfully');
    }

    /**
     * Click the login button
     */
    async clickLoginButton(): Promise<void> {
        console.log('🚀 Clicking login button...');
        
        // Try primary selector first, then fallback
        try {
            await this.loginButton.waitFor({ state: 'visible', timeout: 5000 });
            await this.loginButton.click();
        } catch {
            console.log('🚀 Using alternative login button selector...');
            await this.loginButtonAlt.first().waitFor({ state: 'visible' });
            await this.loginButtonAlt.first().click();
        }
        console.log('✅ Login button clicked');
    }

    /**
     * Complete login workflow with provided credentials
     */
    async login(email: string, password: string): Promise<void> {
        console.log(`🔑 Starting login workflow for: ${email}`);
        
        await this.waitForLoginPageReady();
        await this.enterEmail(email);
        await this.enterPassword(password);
        await this.clickLoginButton();
        
        console.log('⏳ Waiting for login to process...');
        await this.page.waitForTimeout(3000);
    }

    /**
     * Login with test credentials from environment variables (USER_EMAIL, USER_PASSWORD)
     */
    async loginWithTestCredentials(): Promise<void> {
        const email = process.env.USER_EMAIL;
        const password = process.env.USER_PASSWORD;
        if (!email || !password) {
            throw new Error('USER_EMAIL and USER_PASSWORD environment variables must be set');
        }
        console.log(`🧪 Logging in with test credentials: ${email}`);
        await this.login(email, password);
    }

    /**
     * Check if login was successful by looking for URL change or dashboard elements
     */
    async isLoginSuccessful(): Promise<boolean> {
        console.log('🔍 Checking if login was successful...');
        
        // Wait a bit for potential redirects
        await this.page.waitForTimeout(2000);
        
        const currentUrl = this.page.url();
        console.log(`Current URL: ${currentUrl}`);
        
        // Check for URL change (successful login usually redirects)
        const baseUrl = getBaseUrl();
        const isUrlChanged = !currentUrl.includes('login') && currentUrl !== baseUrl;
        
        // Check for absence of login form (successful login hides login form)
        const loginFormVisible = await this.isLoginFormVisible();
        
        // Check for common post-login elements
        const hasPostLoginElements = await this.hasPostLoginElements();
        
        const isSuccessful = isUrlChanged || !loginFormVisible || hasPostLoginElements;
        
        console.log(`🔍 Login success indicators:`);
        console.log(`   URL changed from login: ${isUrlChanged}`);
        console.log(`   Login form hidden: ${!loginFormVisible}`);
        console.log(`   Post-login elements found: ${hasPostLoginElements}`);
        console.log(`   Overall success: ${isSuccessful}`);
        
        return isSuccessful;
    }

    /**
     * Check if login form is currently visible
     */
    async isLoginFormVisible(): Promise<boolean> {
        try {
            const emailVisible = await this.emailInput.isVisible().catch(() => 
                this.emailInputAlt.first().isVisible().catch(() => false)
            );
            const passwordVisible = await this.passwordInput.isVisible().catch(() =>
                this.passwordInputAlt.first().isVisible().catch(() => false)
            );
            return emailVisible && passwordVisible;
        } catch {
            return false;
        }
    }

    /**
     * Check for common post-login elements
     */
    async hasPostLoginElements(): Promise<boolean> {
        const postLoginSelectors = [
            '[aria-label*="dashboard"]',
            '[aria-label*="profile"]',
            'button:has-text("Logout")',
            'button:has-text("Sign out")',
            '.dashboard',
            '.main-content',
            '.user-menu',
            '.nav-user'
        ];
        
        for (const selector of postLoginSelectors) {
            const isVisible = await this.page.locator(selector).isVisible().catch(() => false);
            if (isVisible) {
                console.log(`✅ Found post-login element: ${selector}`);
                return true;
            }
        }
        return false;
    }

    /**
     * Check for login error messages
     */
    async getLoginError(): Promise<string | null> {
        try {
            const errorVisible = await this.errorMessage.isVisible();
            if (errorVisible) {
                const errorText = await this.errorMessage.textContent();
                return errorText?.trim() || null;
            }
        } catch {
            // Try common error selectors
            const commonErrorSelectors = [
                '.error-message',
                '.alert-error',
                '.text-red-500',
                '[role="alert"]',
                '.invalid-feedback'
            ];
            
            for (const selector of commonErrorSelectors) {
                const element = this.page.locator(selector);
                const isVisible = await element.isVisible().catch(() => false);
                if (isVisible) {
                    const text = await element.textContent();
                    if (text?.trim()) {
                        return text.trim();
                    }
                }
            }
        }
        return null;
    }

    /**
     * Get current email field value
     */
    async getEmailValue(): Promise<string> {
        try {
            return await this.emailInput.inputValue();
        } catch {
            return await this.emailInputAlt.first().inputValue();
        }
    }

    /**
     * Check if password field has a value
     */
    async hasPasswordValue(): Promise<boolean> {
        try {
            const value = await this.passwordInput.inputValue();
            return value.length > 0;
        } catch {
            const value = await this.passwordInputAlt.first().inputValue();
            return value.length > 0;
        }
    }

    /**
     * Take screenshot for debugging
     */
    async takeScreenshot(name: string = 'login-debug'): Promise<void> {
        await this.page.screenshot({ path: `${name}.png` });
        console.log(`📸 Screenshot saved: ${name}.png`);
    }

    /**
     * Wait for page navigation after login
     */
    async waitForNavigation(timeout: number = 30000): Promise<void> {
        console.log('⏳ Waiting for navigation after login...');
        try {
            await this.page.waitForURL(url => !url.toString().includes('login'), { timeout });
            console.log('✅ Navigation completed');
        } catch {
            console.log('⚠️ No navigation detected within timeout');
        }
    }

    /**
     * Verify login page elements are present
     */
    async verifyLoginPageElements(): Promise<void> {
        console.log('🔍 Verifying login page elements...');
        
        await expect(this.emailInput.or(this.emailInputAlt)).toBeVisible();
        await expect(this.passwordInput.or(this.passwordInputAlt)).toBeVisible();
        await expect(this.loginButton.or(this.loginButtonAlt)).toBeVisible();
        
        console.log('✅ All login page elements are present');
    }
} 