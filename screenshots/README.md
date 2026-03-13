# Screenshots Folder

This folder contains screenshots taken during test execution for debugging and verification purposes.

## File Naming Convention

Screenshots are automatically named with the following pattern:
- `YYYY-MM-DDTHH-MM-SS-sssZ_name_description.png`

Examples:
- `2024-01-15T10-30-45-123Z_login-page_after-credentials.png`
- `2024-01-15T10-30-46-456Z_patient-selection_dropdown-open.png`

## Screenshot Types

1. **Full Page Screenshots**: Captured using `takeScreenshot()`
2. **Element Screenshots**: Captured using `takeElementScreenshot()`

## Usage in Tests

```typescript
import { BasePage } from '../page_objects/BasePage';

const basePage = new BasePage(page);

// Take a full page screenshot
await basePage.takeScreenshot('login-page', 'after-credentials');

// Take an element screenshot
await basePage.takeElementScreenshot('button#submit', 'submit-button', 'before-click');
```

## Cleanup

Old screenshots are automatically cleaned up to keep only the last 50 files. This helps manage disk space while preserving recent debugging information.

## Manual Cleanup

To manually clean up screenshots, you can run:
```bash
# Remove all screenshots
rm -rf screenshots/*.png

# Or use the utility function in your tests
await ScreenshotUtils.cleanupOldScreenshots(10); // Keep only last 10
``` 