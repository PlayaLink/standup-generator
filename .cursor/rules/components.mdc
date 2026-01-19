# Component Usage Rules

## Priority 1: CHG Unified Design System
Always use components from `@oxymormon/chg-unified-ds` when available:

**Available components:**
- Accordion, AccordionItem
- Avatar
- Branding
- Button
- Chip
- CounterBadge
- Divider
- DotStatus
- Dropdown (trigger only)
- Field (form wrapper)
- FileUpload
- Keys
- PillToggle
- ProgressBar
- Radio, RadioGroup
- Slider
- Slot
- Status
- StepIndicator
- Tabs
- Tag
- Textarea
- TextInput
- Toast
- Toggle
- Tooltip, TooltipTrigger

**Patterns** (higher-level compositions in `patterns/`):
- ActionMenu, ActionMenu.Item, ActionMenu.Divider
- SideNavigation, SideNavigationSearch, SideNavigationSection, SideNavigationItem, SideNavigationSubItem, SideNavigationAccount

## Priority 2: Custom Components with React Aria
If a component is NOT in the design system above, create it in `src/components/` using [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html).

Common React Aria components to use for custom implementations:
- Select, ComboBox for dropdowns with selection
- Dialog, Modal for overlays
- Popover for floating content
- ListBox for selection lists
- DatePicker, Calendar, DateField for dates
- NumberField for numeric inputs
- SearchField for search inputs
- Breadcrumbs for navigation
- Link for accessible links
- Table for data tables
- GridList for grid layouts
- Checkbox, CheckboxGroup for checkboxes
- Form for form handling

## Implementation Pattern for Custom Components
When creating custom components in `src/components/`:
1. Use React Aria Components as the base
2. Follow the design system's styling patterns (Tailwind CSS)
3. Use the `data-theme` attribute for theming consistency
