# Professional UI/UX Design System
## AI Resume Parser - Frontend Design Guide

---

## 🎨 Color Palette

### Brand Colors
- **Primary**: `#6366F1` (Indigo) - Main actions, highlights
- **Secondary**: `#EC4899` (Pink) - Secondary actions
- **Success**: `#10B981` (Green) - Confirmations, positive states
- **Warning**: `#F59E0B` (Amber) - Cautions, warnings
- **Danger**: `#EF4444` (Red) - Errors, critical alerts
- **Info**: `#0EA5E9` (Blue) - Informational messages

### Neutral Palette
| Color Name | Hex | CSS Value | Usage |
|---|---|---|---|
| Text Primary | #1E293B | `THEME.colors.textPrimary` | Main text |
| Text Secondary | #475569 | `THEME.colors.textSecondary` | Supporting text |
| Text Tertiary | #94A3B8 | `THEME.colors.textTertiary` | Muted text |
| Surface | #FFFFFF | `THEME.colors.surface` | Cards, panels |
| Background | #F8FAFC | `THEME.colors.background` | Screen background |
| Border | #E2E8F0 | `THEME.colors.border` | Dividers, borders |

---

## 📐 Spacing System

```typescript
xs:    4px   // Tight spacing
sm:    8px   // Small gaps
md:   12px   // Medium (default)
lg:   16px   // Large
xl:   20px   // Extra large
xxl:  24px   // Double extra large
xxxl: 32px   // Triple extra large
```

**Usage Guidelines:**
- Use `lg` for standard padding in cards and sections
- Use `md` for spacing between form elements
- Use `xl` for section separation
- Use `sm` for tight component spacing

---

## 🔤 Typography

### Font Family
- **Primary**: Poppins (all weights)
- **Regular**: 400
- **Medium**: 500
- **SemiBold**: 600
- **Bold**: 700
- **Extra Bold**: 800

### Type Scale

| Level | Size | Weight | Usage |
|---|---|---|---|
| **H1** | 32px | Bold (800) | Page headlines |
| **H2** | 28px | Bold (700) | Section titles |
| **H3** | 24px | Bold (700) | Subsection titles |
| **H4** | 20px | SemiBold (600) | Card titles |
| **Body** | 16px | Regular (400) | Main content |
| **Label** | 14px | SemiBold (600) | Form labels, badges |
| **Caption** | 12px | Regular (400) | Helper text |
| **Small** | 10px | Regular (400) | Metadata |

---

## 🔘 Component Interaction States

### Buttons

**Variants:**
- `primary` - Main actions
- `secondary` - Secondary actions
- `success` - Confirmations
- `danger` - Destructive actions
- `outline` - Alternative style
- `ghost` - Minimal style

**Sizes:**
- `sm` - 32px height, smaller text
- `md` - 44px height, standard
- `lg` - 52px height, prominent

**States:**
- **Default** - Interactive, hover effect
- **Active** - Currently selected
- **Disabled** - 60% opacity
- **Loading** - Shows spinner

### Inputs

**Variants:**
- `default` - Standard bordered input
- `filled` - Subtle background fill
- `outline` - Strong border

**States:**
- **Default** - Normal appearance
- **Focused** - Blue border, shadow
- **Error** - Red border, error message
- **Disabled** - Grayed out

### Cards

**Variants:**
- `default` - Standard card with border
- `elevated` - Prominent with shadow
- `outline` - Strong border, subtle background
- `soft` - Minimal, soft background
- `interactive` - Touchable, hover states

---

## 🎯 Border Radius

```typescript
xs:   4px   // Subtle rounding
sm:   6px   // Small buttons
md:  10px   // Standard components
lg:  12px   // Cards, larger inputs
xl:  16px   // Modals, large cards
full: 999px // Circles, badges
```

---

## 💫 Shadows & Elevation

| Level | Usage |
|---|---|
| `none` | Flat, no elevation |
| `xs` | Subtle lift |
| `sm` | Light elevation |
| `md` | Standard elevation |
| `lg` | Prominent elevation |
| `xl` | Maximum elevation (modals) |

---

## ✨ Animations

### Durations
- `xs`: 100ms - Quick feedback
- `sm`: 150ms - Standard interaction
- `md`: 200ms - Default duration
- `lg`: 300ms - Transitions
- `xl`: 400ms - Slower elements

### Common Patterns
- Button press: 100-150ms scale/opacity
- Transitions: 200-300ms with ease-out
- Loading: Smooth spinner
- Toast: 300-400ms slide in/out

---

## 📱 Layout Patterns

### Screen Container
```typescript
import { layoutUtils } from '@/utils/layoutUtils';

// Screen with safe padding
<View style={[layoutUtils.screenContainer, layoutUtils.screenPadding]}>
  {/* Content */}
</View>
```

### Section Layout
```typescript
// Header + Content + Footer
<View style={layoutUtils.screenContainer}>
  <View>{/* Header */}</View>
  <ScrollView style={layoutUtils.flex1}>
    {/* Content with spacing */}
  </ScrollView>
  <View>{/* Footer CTA */}</View>
</View>
```

### Flex Utilities
```typescript
layoutUtils.rowCenter      // Horizontal row, centered
layoutUtils.rowBetween     // Space between items
layoutUtils.center         // Center all content
layoutUtils.gap('lg')      // Gap between children
```

---

## 🎨 Component Usage Examples

### Button
```typescript
import { Button } from '@/components/ui';

// Primary action
<Button
  title="Parse Resume"
  onPress={handleParse}
  variant="primary"
  size="lg"
  fullWidth
/>

// Secondary with icon
<Button
  title="Upload"
  icon={<Icon name="upload" />}
  variant="secondary"
/>
```

### Card
```typescript
import { Card } from '@/components/ui';

// Elevated card
<Card variant="elevated" padding="lg">
  <ThemedText variant="h4">Title</ThemedText>
  <ThemedText variant="body">Content</ThemedText>
</Card>
```

### Input
```typescript
import { Input } from '@/components/ui';

<Input
  label="Job Description"
  placeholder="Enter JD..."
  value={jdText}
  onChangeText={setJdText}
  variant="outline"
  multiline
  maxLength={5000}
  hint="Paste your job description here"
/>
```

### StatCard
```typescript
import { StatCard } from '@/components/ui';

<StatCard
  icon="📄"
  label="Resumes Processed"
  value="128"
  trend={{ value: 23, isPositive: true }}
  variant="highlight"
/>
```

### AlertBanner
```typescript
import { AlertBanner } from '@/components/ui';

<AlertBanner
  type="success"
  title="Upload Successful"
  message="Your resume has been processed"
  onDismiss={() => setShowAlert(false)}
/>
```

---

## ♿ Accessibility Guidelines

1. **Contrast Ratio**: Minimum 4.5:1 for all text
2. **Touch Targets**: Minimum 48px × 48px
3. **Semantic Components**: Use proper Text/TouchableOpacity
4. **Labels**: All inputs must have visible labels
5. **Color**: Don't rely solely on color for meaning
6. **Focus States**: Clear focus indicators

---

## 📏 Responsive Design

### Mobile First
- Start with mobile layout
- Expand for tablets/desktop
- Test on multiple screen sizes

### Common Breakpoints
- Mobile: < 600px
- Tablet: 600px - 1024px
- Desktop: > 1024px

---

## 🚀 Performance Tips

1. Use `THEME` constants, not hardcoded values
2. Memoize complex components
3. Optimize re-renders with `useCallback`
4. Use `FlatList` for long lists
5. Lazy load images

---

## 🔧 Customization

### Creating Custom Variants
```typescript
// Button.tsx
button_custom: {
  backgroundColor: THEME.colors.primary,
  ... custom styles
}
```

### Extending Theme
```typescript
// theme.ts
export const THEME = {
  ...existing,
  custom: {
    // New properties
  }
}
```

---

## 📚 Files Reference

- **Theme**: `src/theme.ts`
- **UI Components**: `src/components/ui/`
- **Layout Utils**: `src/utils/layoutUtils.ts`
- **ThemedText**: `src/components/ThemedText.tsx`

---

## ✅ Design Checklist

- [ ] Using THEME constants consistently
- [ ] Proper spacing (THEME.spacing)
- [ ] Accessible color contrast
- [ ] Touch targets >= 48px
- [ ] Loading states shown
- [ ] Error states handled
- [ ] Empty states designed
- [ ] Responsive on mobile/tablet
- [ ] Proper button feedback
- [ ] Consistent typography

