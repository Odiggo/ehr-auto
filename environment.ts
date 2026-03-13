import * as dotenv from 'dotenv';
import * as path from 'path';

// Always load from .env at project root; use ENV/NODE_ENV only as a logical flag
dotenv.config({ path: path.resolve(__dirname, '.env') });
const env = process.env.ENV || process.env.NODE_ENV || 'staging';

export const environment = {
  prodUrl: process.env.APP_URL || 'https://app.sully.ai',
  stagingUrl: process.env.STAGING_URL || 'https://beta.sully.ai',
  devUrl: process.env.DEV_URL || 'https://dev.sully.ai',
  localUrl: process.env.LOCAL_URL || 'http://localhost:3000',
  
  // Test configuration
  testTimeout: parseInt(process.env.TEST_TIMEOUT || '130000'),
  headless: process.env.HEADLESS === 'true',
  
  // Optional API key if needed
  apiKey: process.env.API_KEY || '',
  
  // Current environment info
  currentEnv: env,
  isProduction: env === 'production',
  isStaging: env === 'staging',
  isDevelopment: env === 'development',
  isLocal: env === 'local'
};

// Get base URL based on environment
export const getBaseUrl = () => {
  const env = environment.currentEnv.toLowerCase();

  switch (env) {
    case 'local':
      return environment.localUrl;
    case 'dev':
    case 'development':
      return environment.devUrl;
    case 'staging':
      return environment.stagingUrl;
    case 'prod':
    case 'production':
    default:
      return environment.prodUrl;
  }
};

// Get API key if available
export const getApiKey = () => environment.apiKey;

// Check if running in specific environment
export const isProduction = () => environment.isProduction;
export const isStaging = () => environment.isStaging;
export const isDevelopment = () => environment.isDevelopment;
export const isLocal = () => environment.isLocal;

// Get test configuration
export const getTestConfig = () => ({
  timeout: environment.testTimeout,
  headless: environment.headless,
  baseUrl: getBaseUrl()
});

// Print current environment info
export const printEnvironmentInfo = () => {
  console.log(`\n🌍 Sully AI Environment Configuration:`);
  console.log(`   Environment: ${environment.currentEnv}`);
  console.log(`   Base URL: ${getBaseUrl()}`);
  console.log(`   Test Timeout: ${environment.testTimeout}ms`);
  console.log(`   Headless Mode: ${environment.headless}`);
  if (environment.apiKey) {
    console.log(`   API Key: ${'*'.repeat(environment.apiKey.length - 4)}${environment.apiKey.slice(-4)}`);
  }
  console.log(`\n`);
};
