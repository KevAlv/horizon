# Adding Temporary UX Settings

## Instructions

This guide explains how to add temporary UX development settings to sections or blocks to accelerate the UX feedback loop. These settings allow UX designers to quickly test different values without requiring code changes.

## When to Use UX Settings

**Important**: UX settings should be used sparingly and selectively. Not every CSS value needs to be a setting - only add settings for values that are highly relevant to the specific feature being developed or modified.

Add temporary UX settings when:

- UX team needs to test different CSS values (spacing, sizing, heights, etc.)
- Iterating on visual design decisions
- Gathering feedback on specific measurements before finalizing
- Testing responsive behavior across different breakpoints
- Need rapid iteration without deploying code changes

**Do NOT use UX settings for:**

- Production features
- Settings that users should control
- Settings that need translation
- Permanent theme configuration
- Minor adjustments that don't significantly impact the feature
- Values that are unlikely to change during UX review
- Every possible CSS property (be selective!)

## Steps to Add UX Settings

### Step 1: Add Settings to Section or Block Schema

Add settings to the appropriate schema file in `schemas/sections/[section-name].js` or `schemas/blocks/[block-name]`:

```javascript
// At the end of the settings array, before presets
{
  type: 'header',
  content: 't:content.ux_dev_settings.label',
},
{
  type: 'range',
  id: 'ux_mobile_slide_width',
  label: 't:settings.ux_dev_settings.mobile_slide_width',
  min: 60,
  max: 100,
  step: 1,
  unit: '%',
  default: 90,
},
{
  type: 'range',
  id: 'ux_desktop_image_height',
  label: 't:settings.ux_dev_settings.desktop_image_height',
  min: 20,
  max: 100,
  step: 1,
  unit: 'dvh',
  default: 40,
},
```

**Naming conventions:**

- Prefix all UX settings with `ux_`
- Use descriptive names: `ux_mobile_slide_width`, `ux_desktop_image_height_small`
- Group related settings together (mobile vs desktop, different sizes)
- Always include the "UX Dev Settings" header

**Setting types:**

- `range` - For numeric values (most common)
- `select` - For predefined options
- `checkbox` - For boolean toggles

### Step 2: Add Translation Keys

**IMPORTANT:** The header translation goes in the `"content"` section (NOT `"info"`, NOT `"names"`).

Add translation labels to `locales/en.default.schema.json`:

```json
{
  "content": {
    "ux_dev_settings": {
      "label": "UX Dev Settings"
    }
  },
  "settings": {
    "ux_dev_settings": {
      "mobile_slide_width": "Mobile slide width",
      "mobile_slide_gap": "Mobile slide gap",
      "desktop_image_height_auto": "Desktop image height (auto)",
      "desktop_image_height_small": "Desktop image height (small)"
    }
  }
}
```

**Translation patterns:**

- **For `content` section**: Use nested object under `ux_dev_settings`
  - Referenced in schema as: `content: 't:content.ux_dev_settings.label'`
  - ✅ CORRECT: `"ux_dev_settings": { "label": "UX Dev Settings" }` (nested object)
- **For `settings` section**: Use nested object under `ux_dev_settings`
  - Referenced in schema as: `label: 't:settings.ux_dev_settings.mobile_slide_width'`
  - ✅ CORRECT: `"ux_dev_settings": { "mobile_slide_width": "..." }` (nested object)
- Use clear, descriptive labels that indicate what the setting controls
- Include context in parentheses when needed (e.g., "(auto)", "(small)")
- Specify breakpoint when relevant ("Mobile" vs "Desktop")

### Step 3: Pass Settings as CSS Variables

In the section liquid file (e.g., `sections/slideshow.liquid`), add CSS custom properties to the style attribute:

```liquid
<div
  class="section"
  style="
    --ux-mobile-slide-width: {{ section.settings.ux_mobile_slide_width }}%;
    --ux-desktop-image-height-auto: {{ section.settings.ux_desktop_image_height_auto }}dvh;
    --ux-desktop-image-height-small: {{ section.settings.ux_desktop_image_height_small }}dvh;
  "
>
```

**CSS variable naming:**

- Convert snake_case to kebab-case: `ux_mobile_slide_width` → `--ux-mobile-slide-width`
- Keep `ux-` prefix in CSS variables
- Include units directly in the liquid output: `{{ value }}%`, `{{ value }}dvh`, `{{ value }}px`

### Step 4: Update CSS to Use Variables

Update the relevant CSS in `assets/base.css` or the relevant component file (could be in `section/` or `blocks/`) to use the CSS variables with fallback values:

```css
.slideshow--with-hints slideshow-slide {
  width: var(--ux-mobile-slide-width, 90%);
}

@media screen and (min-width: 750px) {
  .slideshow--content-below-media [size='small'] .slide__image-container {
    max-height: var(--ux-desktop-image-height-small, 20dvh);
  }
}
```

**CSS variable usage:**

- Always provide fallback values: `var(--ux-variable, fallback)`
- Fallback should match the default in the schema
- Use media queries for responsive settings
- Maintain existing CSS structure

### Step 5: Build Schemas

Run the schema build command to sync changes to liquid files:

```bash
npm run build:schemas
```

This will update the `{% schema %}` tag in section liquid files.

## Complete Example

Here's a complete example adding UX settings for image heights:

**1. Schema (`schemas/sections/slideshow.js`):**

```javascript
settings: [
  // ... existing settings ...
  {
    type: 'header',
    content: 't:content.ux_dev_settings.label',
  },
  {
    type: 'range',
    id: 'ux_mobile_image_height_small',
    label: 't:settings.ux_dev_settings.mobile_image_height_small',
    min: 20,
    max: 100,
    step: 1,
    unit: 'dvh',
    default: 30,
  },
  {
    type: 'range',
    id: 'ux_desktop_image_height_small',
    label: 't:settings.ux_dev_settings.desktop_image_height_small',
    min: 20,
    max: 100,
    step: 1,
    unit: 'dvh',
    default: 20,
  },
];
```

**2. Translations (`locales/en.default.schema.json`):**

```json
{
  "content": {
    "ux_dev_settings": {
      "label": "UX Dev Settings"
    }
  },
  "settings": {
    "ux_dev_settings": {
      "mobile_image_height_small": "Mobile image height (small)",
      "desktop_image_height_small": "Desktop image height (small)"
    }
  }
}
```

**3. Liquid (`sections/slideshow.liquid`):**

```liquid
<div
  class="section"
  style="
    --ux-mobile-image-height-small: {{ section.settings.ux_mobile_image_height_small }}dvh;
    --ux-desktop-image-height-small: {{ section.settings.ux_desktop_image_height_small }}dvh;
  "
>
```

**4. CSS (`assets/base.css`):**

```css
.slideshow--content-below-media [size='small'] .slide__image-container {
  max-height: var(--ux-mobile-image-height-small, 30dvh);
}

@media screen and (min-width: 750px) {
  .slideshow--content-below-media [size='small'] .slide__image-container {
    max-height: var(--ux-desktop-image-height-small, 20dvh);
  }
}
```

**5. Build:**

```bash
npm run build:schemas
```

## What Works Well

- **CSS custom properties**: Using CSS variables with fallbacks provides clean, maintainable code
- **Descriptive naming**: Clear naming conventions make settings easy to understand and use
- **Grouped settings**: Organizing related settings (mobile/desktop, different sizes) improves UX
- **Default values**: Matching schema defaults with CSS fallbacks ensures consistency
- **Range settings**: Provides intuitive controls with visual feedback in theme editor
- **dvh units**: Using viewport height units works well for responsive sizing
- **Incremental approach**: Adding settings for specific use cases as needed

## What Doesn't Work Well / Pitfalls to Avoid

- **Wrong translation section**: Header labels MUST go in the `"content"` section of `en.default.schema.json`, NOT in `"info"` or `"names"`. Use nested object structure: `"ux_dev_settings": { "label": "UX Dev Settings" }` and reference as `t:content.ux_dev_settings.label`.
- **Invalid decimal precision**: Default values must match the step's decimal precision. If `step: 0.5`, defaults can have max 1 decimal digit (e.g., 26.5 is valid, 26.25 is invalid). If `step: 1`, use whole numbers only.
- **Too many settings**: Adding too many UX settings clutters the interface and slows down UX iteration. Be highly selective - only add settings for values that are core to the feature and likely to need adjustment. Aim for 2-5 settings per feature maximum. If you find yourself adding more, reconsider which values truly need to be adjustable.
- **Missing fallbacks**: Always include fallback values in CSS `var()` - settings might not exist in older themes
- **Wrong units**: Ensure units match between schema (unit property) and liquid (output)
- **Forgetting build step**: Must run `npm run build:schemas` to sync changes to liquid files
- **Inconsistent naming**: Keep naming consistent across schema, translations, liquid, and CSS
- **Missing translation keys**: Remember to add keys to `en.default.schema.json` - build will fail without them
- **Production settings**: Don't use UX settings for permanent features - they're meant to be temporary
- **Forgetting media queries**: Mobile and desktop settings need appropriate media query handling
- **Copy-paste errors**: When adding multiple similar settings, carefully check IDs and labels
- **Unit mismatch**: Schema unit property (e.g., `unit: 'dvh'`) must match liquid output

## Common Setting Patterns

### Spacing/Sizing (Percentage)

```javascript
{
  type: 'range',
  id: 'ux_mobile_slide_width',
  label: 't:settings.ux_dev_settings.mobile_slide_width',
  min: 60,
  max: 100,
  step: 1,
  unit: '%',
  default: 90,
}
```

### Height (Viewport Units)

```javascript
{
  type: 'range',
  id: 'ux_desktop_image_height',
  label: 't:settings.ux_dev_settings.desktop_image_height',
  min: 20,
  max: 100,
  step: 1,
  unit: 'dvh',
  default: 40,
}
```

### Gap/Spacing (Pixels)

```javascript
{
  type: 'range',
  id: 'ux_mobile_slide_gap',
  label: 't:settings.ux_dev_settings.mobile_slide_gap',
  min: 0,
  max: 30,
  step: 1,
  unit: 'px',
  default: 12,
}
```

## Testing Your Settings

1. **Build schemas**: `npm run build:schemas`
2. **Run local dev**: `npm run dev`
3. **Open theme editor**: Navigate to the section with your new settings
4. **Verify settings appear**: Check that "UX Dev Settings" header and controls are visible
5. **Test values**: Adjust settings and verify changes appear correctly
6. **Check defaults**: Ensure default values match your CSS fallbacks
7. **Test responsiveness**: If you have mobile/desktop settings, test on different screen sizes

## Removing UX Settings

When UX team has finalized values:

1. **Update CSS**: Replace CSS variables with final hardcoded values
2. **Remove schema settings**: Delete UX settings from schema file
3. **Remove translations**: Delete UX setting keys from locale files
4. **Remove liquid variables**: Remove CSS variable declarations from liquid
5. **Build schemas**: Run `npm run build:schemas`
6. **Test**: Verify everything still works with hardcoded values
7. **Commit**: Create commit like "Finalize [feature] values, remove UX settings"

## Summary

The key to successfully adding UX settings is to:

1. **Be selective**: Only add settings for values highly relevant to the feature (aim for 2-5 settings max)
2. Use consistent naming with `ux_` prefix
3. Add settings to section schema with appropriate types and ranges
4. Add translation keys to locale files
5. Pass settings as CSS variables in liquid templates
6. Use CSS variables with fallback values
7. Run `npm run build:schemas` to sync changes
8. Test thoroughly in theme editor
9. Remove settings once values are finalized
