# TodoCard

A lightweight todo app with add, edit, delete, and completion tracking.

## Features

- Add new tasks with title, description, due date, priority, and tags
- Edit existing tasks
- Mark tasks as complete with status transitions (Pending, In Progress, Done)
- Priority indicators with visual cues
- Expand/collapse descriptions for long content
- Overdue indicators and dynamic time updates
- Local storage persistence
- Responsive design
- Full keyboard accessibility

## Enhancements from Stage 0

### New Functionality Added:
- **Status Controls**: Dropdown for task status (Pending, In Progress, Done) synced with checkbox
- **Priority Indicators**: Colored dots/borders for High (red), Medium (orange), Low (green)
- **Expand/Collapse**: Descriptions >100 chars collapse by default with toggle button
- **Overdue Handling**: Red visual indicators and "Overdue" text for past due tasks
- **Granular Time Updates**: Shows minutes/hours/days remaining, updates every 30 seconds
- **Completed Tasks**: Time stops updating, shows "Completed"

### Design Decisions:
- Status dropdown uses semantic HTML with proper labeling
- Priority indicators are small colored circles for minimal visual clutter
- Expand/collapse uses aria-expanded/aria-controls for accessibility
- Overdue styling uses red accents without overwhelming the UI
- Time updates are polite (aria-live="polite") to avoid screen reader spam

### Accessibility Improvements:
- All form fields have proper labels
- Keyboard navigation follows logical tab order
- ARIA attributes for dynamic content
- Focus management in edit mode
- High contrast colors for indicators

### Known Limitations:
- No server-side persistence (uses localStorage)
- Time updates only when page is active
- No drag-and-drop reordering
- Limited to single user (no sharing)

## Usage

1. Open `index.html` in a web browser
2. Add tasks using the form at the top
3. Use the checkbox or status dropdown to update task status
4. Click "Edit" to modify tasks
5. Long descriptions will collapse - click "Expand" to see full content

## Development

This is a vanilla HTML/CSS/JavaScript application with no build dependencies.
