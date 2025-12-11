# Writing Tests for Liquid Themes

This document provides the starting point for writing tests for Liquid themes.

Liquid themes use two main types of tests:

- **Visual tests**: Verify rendered layouts using Playwright's `expect(element).toHaveSnapshot()` or the utilities in `visualRegressionTests.js`
- **Functional tests**: Test user interactions and component behavior. These are typically more complex and benefit from using the Page Object Model (POM) pattern

## Process Overview

### Step 1: Read and Understand Requirements

- Use `scripts/view-issue.sh <issue-number>` to read GitHub issues
- Review the issue title and body to understand:
  - What component/feature needs testing
  - Specific test scenarios requested
  - Any example code provided
- Check if any of the requested tests already exist elsewhere

### Next Steps

For the complete test writing process, refer to the detailed guide:

📖 **[.cursor/references/writing-tests.md](.cursor/references/writing-tests.md)**

This reference guide contains:

**Process Steps:**

- **Step 1**: Understand What Needs Testing
- **Step 2**: Identify Test Location
- **Step 3**: Create Test Files and Plan Tests (with substeps 3a-3e)
  - Step 3a: Discover All Test Cases
  - Step 3b: Consider Existing Test Files
  - Step 3c: Filter Out Non-Testable Cases
  - Step 3d: Organize Test Templates
  - Step 3e: Testing Private Blocks in Sections
- **Step 4**: Consider using a Page Object Model
- **Step 5**: Create Test Implementation
- **Step 6**: Test Setup - Copy Test Files
- **Step 7**: Running Tests and Debugging
- **Step 8**: Refactor Other Tests
- **Step 9**: Commit and Create Pull Request
- **Step 10**: Write Down Learnings

**Comprehensive Sections:**

- What Works Well
- What Doesn't Work / Pitfalls to Avoid
- Test Implementation Notes
- Additional Notes (viewport utilities, Playwright locators, Page Object Model)
- Testing Static Visual Components
- Testing Private Blocks in Sections
- Common Patterns and Pitfalls
- Key Principles Summary

The reference guide provides all the detailed information needed to successfully write and implement tests for Liquid themes.
