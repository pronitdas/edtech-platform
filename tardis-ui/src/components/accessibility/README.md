# Accessibility Components

## SkipLink

A skip link allows keyboard users to bypass navigation and jump directly to the main content.

```tsx
import { SkipLink } from '@/components/accessibility';

<SkipLink targetId="main-content" label="Skip to main content" />
```

## LiveRegion

Announces dynamic content changes to screen readers.

```tsx
import { LiveRegion } from '@/components/accessibility';

<LiveRegion message={statusMessage} type="polite" />
```

## FocusTrap

Traps focus within a container (useful for modals and dialogs).

```tsx
import { FocusTrap } from '@/components/accessibility';

<FocusTrap isActive={isModalOpen}>
  <ModalContent />
</FocusTrap>
```

## A11yAnnouncerProvider

Provides announcement functionality throughout the app.

```tsx
import { A11yAnnouncerProvider } from '@/components/accessibility';

<App>
  <A11yAnnouncerProvider>
    <YourAppContent />
  </A11yAnnouncerProvider>
</App>
```

## Utilities

### Contrast Checking
```tsx
import { getContrastRatio, meetsContrastRequirements } from '@/utils/accessibility-utils';

const ratio = getContrastRatio('#ffffff', '#3b82f6'); // Returns 7.5
const isCompliant = meetsContrastRequirements('#ffffff', '#3b82f6', 'normal', 'AA'); // Returns true
```

### Focus Management
```tsx
import { useFocusTrap, useFocusManagement } from '@/utils/accessibility-utils';
```

### Keyboard Shortcuts
```tsx
import { useKeyboardShortcuts } from '@/utils/accessibility-utils';

useKeyboardShortcuts([
  {
    key: 'Escape',
    description: 'Close modal',
    action: () => closeModal(),
  },
]);
```

## WCAG 2.1 AA Checklist

- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text (18pt+ or 14pt+ bold)
- [ ] All interactive elements have visible focus indicators
- [ ] All images have alt text
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Skip links are present and functional
- [ ] Focus is managed properly in modals/dialogs
- [ ] Keyboard navigation works for all features
- [ ] ARIA landmarks are used correctly
- [ ] Reduced motion preference is respected
- [ ] High contrast mode is supported
