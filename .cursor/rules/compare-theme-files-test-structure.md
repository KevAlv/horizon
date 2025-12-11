# Test Structure Rules for compare-theme-files

The `.github/scripts/compare-theme-files` directory includes a `main.js` which is run on CI.

The test files within it must be written consistently using ES modules (import/export syntax).

## Configuration Requirements

- Uses ES modules with `"type": "module"` in `.github/scripts/compare-theme-files/package.json`
- Jest runs with `NODE_OPTIONS='--experimental-vm-modules'` flag
- No transformations applied (`transform: {}` in jest.config.js)

## Required Test Case Structure

All test cases for `scripts/compare-theme-files/**/` MUST follow this exact directory structure:

```
caseN-description/
├── description.test.js    # Test file
├── base/                  # Base (existing) theme state
│   └── templates/        # Template JSON files
│       └── *.json
└── pr/                   # PR (proposed) theme changes
    └── templates/
        └── *.json
```

## Test File Requirements

Each test file MUST:

1. **Load templates from files** - Import JSON files directly as ES modules
2. **Use consistent imports**:
   ```javascript
   import baseTemplateJSON from './base/templates/filename.json';
   import prTemplateJSON from './pr/templates/filename.json';
   ```
3. **Set the file property** on loaded templates using spread syntax:
   ```javascript
   const baseTemplate = {
     ...baseTemplateJSON,
     file: 'filename.json',
   };
   const prTemplate = {
     ...prTemplateJSON,
     file: 'filename.json',
   };
   ```
4. **Test the results array's expected length and the error messages** - Look for the expected filename in assertions

```javascript
expect(results).toHaveLength(2);
expect(results).toEqual(
  expect.arrayContaining([
    expect.stringMatching(/Removed static block 'title'/),
    expect.stringMatching(/Removed static block 'content'/),
  ])
);
```

## Directory Naming Convention

Test directories MUST follow the pattern:

- `caseN-kebab-case-description/`
- Where N is the test case number
- Description uses kebab-case (lowercase with hyphens)

## Template File Structure

Template files MUST:

- Be valid JSON
- Follow Shopify template structure
- Be placed in `templates/` subdirectory
- Mirror real theme file locations

## Example Test Structure

```javascript
/* eslint-env node */
import { test, describe, expect } from '@jest/globals';
import { checkStaticBlockChanges } from '../../checkStaticBlockChanges.js';
import baseTemplateJSON from './base/templates/article.json';
import prTemplateJSON from './pr/templates/article.json';

describe('Test Description', () => {
  test('should [expected behavior]', async () => {
    // Create template objects with file property
    const baseTemplate = {
      ...baseTemplateJSON,
      file: 'article.json',
    };
    const prTemplate = {
      ...prTemplateJSON,
      file: 'article.json',
    };

    const results = checkStaticBlockChanges(prTemplate, baseTemplate);

    // Test assertions
    expect(results).toHaveLength(expectedCount);
    expect(results[0]).toContain("Removed static block 'blockId'");
  });
});
```

## Rationale

This structure ensures:

- **Consistency**: All tests follow the same pattern
- **Clarity**: Clear separation between base and PR states
- **Maintainability**: Easy to understand and modify test fixtures
- **Realism**: Tests use actual file structures like real themes
- **Isolation**: Each test is completely self-contained

## DO NOT:

- Use inline JSON data in test files (always import from files)
- Mix test logic and test data
- Share fixtures between test cases
- Use different directory structures
- Skip the base/ or pr/ directories
- Use CommonJS syntax (require/module.exports)
- Use `JSON.parse()` on imported JSON modules (they're already parsed)
- Use `readFile` from fs/promises (use direct JSON imports instead)
