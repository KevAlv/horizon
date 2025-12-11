# Adding a New Feature to Horizon Theme

This is a living document that captures the process and learnings from implementing new features in the Horizon theme. Update this document as you discover new patterns, edge cases, or solutions.

## Process Overview

1. **Step 1a**: Issue Analysis Phase - Understand requirements
2. **Step 1b**: Requirements Gathering - Fill in missing details (if needed)
3. **Step 2a**: Technical Design Phase - Create technical design document
4. **Step 2b**: Implementation Checklist Creation - Create detailed task list
5. **Step 3**: Implementation Phase - Execute using checklist
6. **Step 4**: Testing Phase - Verify across devices/browsers
7. **Step 5**: Documentation Phase - Update learnings

## Process for Adding New Features

### Step 1a: Issue Analysis Phase

- [ ] Read and understand the issue requirements
- [ ] Identify missing information
- [ ] Research existing patterns in codebase
- [ ] Document findings and questions
- [ ] Create analysis document (e.g., `.cursor/temp/feature-name-analysis.md`) to track findings
- [ ] At the end of the last step, this analysis document will be deleted

**When analyzing an issue, determine if you have:**

- ✅ **Sufficient Information**: Clear requirements, specs, and acceptance criteria
- ❌ **Insufficient Information**: Missing critical details → Proceed to Step 1b

**Best Practices for Pattern Research:**

- Search for similar features (e.g., for sticky elements, search: sticky positioning, fixed elements, scroll behaviors)
- Look for existing utility classes before creating new ones
- Check both CSS and JavaScript implementations
- Review mobile vs desktop patterns separately
- Document all relevant files and patterns found

### Step 1b: Requirements Gathering (When Information is Missing)

When an issue lacks sufficient information, ask these essential questions:

**Questions to ask:**

1. **What does it do?** (core functionality)
2. **Where does it go?** (positioning/location)
3. **When does it appear?** (triggers/conditions)

**Note:** Keep it simple - just these 3 questions. The user can provide as much or as little detail as they want. Additional requirements can emerge during implementation, but only as explicitly defined by the user.

**⚠️ CRITICAL: Never Make Up Requirements**

**DO NOT make design decisions that the user hasn't specified. Examples of requirements you should NOT assume:**

- Whether elements should be visible/hidden on certain viewports
- Specific styling choices beyond what's requested
- Behavioral patterns not explicitly mentioned
- Accessibility features beyond AA WCAG compliance

**If something is unclear, ASK - don't assume or "make it better" without confirmation.**

### Step 2a: Technical Design Phase

- [ ] In the .cursor/temp folder, create technical design document (`feature-name-technical-design.md`)
- [ ] Document architecture decisions
- [ ] Identify components to create/modify
- [ ] Plan data flow and state management
- [ ] Consider performance implications
- [ ] Document patterns to follow/avoid

**Technical Design Document Should Include:**

- Architecture decisions and rationale
  - Why specific patterns were chosen (e.g., puppeteering vs. duplicate form)
  - Which existing events/components to leverage
  - Performance optimization strategies
  - Animation and interaction patterns
- Component interfaces and APIs
- Event handling approach
- Performance considerations
- Existing patterns to leverage
- Known gotchas to avoid
- Error handling approach

### Step 2b: Implementation Checklist Creation

- [ ] Create implementation checklist (add to technical design document)
- [ ] Break down work into logical groups based on your technical design
- [ ] Order tasks by dependencies
- [ ] Include only what's needed for this specific feature

**Checklist Structure Guidelines:**

The checklist should be **tailored to your specific feature**. Common sections might include:

- **Setup** - Environment preparation (usually unnecessary)
- **Implementation** - Based on what your feature actually needs
- **Integration** - How it connects to existing code
- **Testing** - Specific to your feature's requirements
- **Documentation** - Any updates needed based on additional learnings

**Important:** The checklist structure should be evaluated and formed based on the needs identified in your technical design, not from a template. Each feature is unique and requires its own specific tasks.

**Example Structure (adapt as needed):**

```markdown
## Implementation Checklist

### Setup

- [ ] Branch/environment setup tasks specific to your feature

### Implementation

- [ ] Tasks based on your technical design
- [ ] Only include what you're actually building
- [ ] Break down complex tasks into sub-items

### Critical Reminders

- [ ] ⚠️ Mark any easy-to-forget steps
```

**Checklist Best Practices:**

- Let the **technical design drive the tasks**, not a template
- Include file paths when creating/modifying files
- Add sub-tasks for complex items
- Mark critical/easy-to-miss steps with ⚠️
- Group related tasks together
- Order by dependency
- Keep it specific to your feature - no boilerplate tasks

### Step 3: Implementation Phase

**Process:**

1. **Open your implementation checklist** created in Step 2b
2. **Work through tasks systematically**, checking off as completed
3. **Test frequently** during implementation
4. **Update the checklist** if new tasks emerge or requirements change

**Working with the Checklist:**

```markdown
# In your technical-design.md file:

## Implementation Checklist

- [x] Create JavaScript component ✅ Done
- [x] Create Liquid snippet ✅ Done
- [ ] Update section schema ← Currently working on this
- [ ] Run npm run build:schemas
```

**Critical Implementation Reminders:**

- **Module Loading:** Add to importmap, use `<script src>` tag, never inline imports
- **Schema Build:** Must run `npm run build:schemas` after modifying schema JS files
- **Liquid Filters:** Can't use filters inside filter parameters - use `{% assign %}` first
- **Dynamic Discovery:** Consider finding elements by data attributes rather than passing IDs

**Testing During Implementation:**

- Run dev server: `shopify theme dev` (⚠️ NEVER add `--store` flag - it causes authorization errors!)
- Check console for errors frequently
- Test mobile layout early
- Verify animations and interactions

**Refer to Cursor Rules for Standards:**

- JavaScript patterns → see `javascript-standards` rule
- CSS implementation → see `css-standards` rule
- Liquid syntax → see `liquid` rule
- Section structure → see `sections` rule
- Snippet patterns → see `snippets` rule
- Schema format → see `schemas` rule
- Localization → see `localization` and `locales` rules

### Step 4: Testing Phase

- [ ] Write automated tests

**Writing Automated Tests:**

- Follow the Page Object Model (POM) pattern for test organization
- See `.cursor/references/writing-tests.md` for comprehensive testing guidance
- Create test templates from existing product.json files rather than writing from scratch
- Place page object models in `tests/page-object-models/`
- Never include console.log statements in test files
- **Avoid using waits** - They slow down tests and are flaky. Use proper element detection instead

### Step 5: Documentation Phase

- [ ] Update this file with learnings if applicable
- [ ] Update theme documentation if needed
- [ ] Document any new patterns created
- [ ] Add examples of usage
- [ ] Archive or delete analysis document (`.cursor/temp/feature-name-analysis.md`) and the tech design document (`.cursor/temp/feature-name-technical-design.md`)

### Step 6: Code Review and Manual Testing

- [ ] Remove all console.log statements from code
- [ ] Keep code comments minimal - only for complex logic
- [ ] Review implementation for any cleanup opportunities. Ask the user for feedback prior to implementation. Point to common patterns throughout the codebase to back up the suggestions
- [ ] Test the feature manually one more time
- [ ] Ask user to perform their own manual testing
- [ ] Address any feedback from user testing
- [ ] Make final adjustments based on real usage

## Lessons Learned

_This section will be updated as we implement features_

- Always check for existing patterns before creating new ones
- Component-based architecture promotes reusability
- Proper planning saves implementation time
- Accessibility should be built-in, not added later
- Performance testing early prevents issues later
- **GitHub CLI Access**: Use `gh issue view [number] --repo Shopify/horizon-private --json` to fetch issues (see `.cursor/references/gh-cli-troubleshooting.md` for PAGER issues)
- **When UX is TBD**: Make informed decisions based on existing patterns and best practices, document assumptions clearly
- **Create analysis documents**: Track findings in a dedicated markdown file (`.cursor/temp/feature-name-analysis.md`) for complex features
- **Puppeteering Pattern**: When adding duplicate UI that triggers existing functionality, consider puppeteering (clicking) the original element instead of duplicating logic
- **Event-Driven Updates**: Leverage existing ThemeEvents (variantUpdate, variantSelected, cartAdd) instead of creating new event systems
- **IntersectionObserver**: Use for visibility detection instead of scroll events for better performance
- **Component Framework**: Always extend from `@theme/component` for consistency with theme architecture
- **Two-State Animations**: Use separate data attributes for visibility and animation states to enable smooth transitions
- **Schema Build Step**: Always run `npm run build:schemas` after modifying schema JS files to push changes to liquid files
- **Module Loading Pattern**: Add modules to importmap in `scripts.liquid`, load with `<script src>` tags, never use inline `import` statements
- **Liquid Filter Chains**: Can't use filters inside filter parameters - assign to variable first with `{% assign %}`
- **Dynamic Element Discovery**: Components commonly find related elements using data attributes (e.g., `data-product-id`, `data-section-id`) rather than passing IDs through multiple layers - this pattern is used throughout the theme
- **Design Updates**: Be prepared to iterate on design - floating card styles often work better than full-width bars for modern UX
- **Implementation Checklists**: Creating a todo checklist during planning makes it easy to track progress and resume work if interrupted
- **Dev Server Usage**: Never use `shopify theme dev --store <name>` - always use `shopify theme dev` without flags to avoid authorization errors
- **Event Cleanup Pattern**: Use AbortController with signal for managing multiple event listeners - see `javascript-standards` rule for the recommended pattern

## Common Pitfalls to Avoid

**Critical Issues to Remember:**

- **Dev Server Command**: NEVER use `shopify theme dev --store <name>` - just use `shopify theme dev` without flags
- **Forgetting Schema Build**: Settings won't appear without `npm run build:schemas`
- **Module Loading**: Never use inline imports, always use importmap pattern
- **Liquid Filters**: Can't use filters inside filter parameters - use `{% assign %}` first
- **Memory Leaks**: Always clean up observers and listeners in `disconnectedCallback`
- **Dynamic Elements**: Find by data attributes, not hardcoded selectors

For comprehensive best practices, refer to the cursor rules for each file type.

## Commit Strategy

**Balance between too many commits and too few:**

- **Initial implementation**: Can be one or two commits
- **Tests**: Should be a separate commit from implementation
- **Bug fixes**: Each fix can be its own commit during development
- **Cleanup/polish**: Final commit after everything works
- **Keep commits logical**: Group related changes together
- **Avoid**: Dozens of tiny commits for initial implementation
- **Prefer**: Meaningful commits that represent complete thoughts/changes

Example commit flow:

1. `feat: add sticky add-to-cart bar implementation`
2. `test: add sticky add-to-cart tests`
3. `fix: handle variant updates correctly`
4. `fix: prevent button spamming`
5. `polish: cleanup and optimize sticky bar`

## Resources

- [Shopify Theme Development Documentation](https://shopify.dev/themes)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Component Framework Documentation](../codex/component-framework.md)
- [Performance Tracking Guide](../codex/performance-tracking.md)
- [Testing Documentation](../codex/testing.md)
- [Writing Tests Reference](../.cursor/references/writing-tests.md)
