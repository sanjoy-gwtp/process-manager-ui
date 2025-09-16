# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Install dependencies**: `npm install`
- **Start development server**: `npm start`
- **Build for production**: `ng build --configuration production`
- **Build for development**: `ng build --configuration development`
- **Watch mode (development)**: `npm run watch`
- **Run tests**: `npm test`

## Project Architecture

This is an Angular application that integrates BPMN.js for creating and editing BPMN diagrams. The application demonstrates how to embed a full-featured BPMN modeler with properties panel into an Angular component.

### Core Components

- **DiagramComponent** (`src/app/diagram/diagram.component.ts`): Main BPMN diagram editor component
  - Uses `bpmn-js/lib/Modeler` for diagram editing capabilities
  - Integrates `BpmnPropertiesPanelModule` for properties editing
  - Supports custom properties through custom providers
  - Includes diagram export functionality to XML format
  - **Dynamic XML Loading**: Loads process definition XML from API via query parameters
  - **URL Format**: `/diagram?processId={id}&processName={name}`
  - **API Integration**: Fetches XML from `GET /api/process-definitions/{id}/xml`
  - **Loading States**: Professional spinner and error handling
  - **Fallback**: Loads default diagram if API fails
  - **Space Optimization**: Enhanced layout with better space utilization
  - **Collapsible Properties**: Toggle properties panel to maximize diagram space
  - **Responsive Design**: Adaptive layout for desktop, tablet, and mobile screens
  - **Property Panel Sizing**: Dynamic sizing (320px-500px based on screen size)
  - **Deployment Functionality**: Deploy diagrams to server via multipart form upload
  - **API Integration**: Uses `POST /api/process-definitions/deploy?name={processName}`
  - **User Feedback**: Success/error notifications with Material Design snackbars
  - **Dialog Interface**: Material Design modal for deployment name input

### BPMN Integration Architecture

The application follows a specific pattern for BPMN.js integration:

1. **ViewChild References**: Uses `@ViewChild` for DOM element references (`diagramRef`, `propertiesRef`)
2. **Modeler Configuration**: Initializes BPMN Modeler with:
   - Container attachment
   - Properties panel configuration
   - Additional modules (BpmnPropertiesPanelModule, custom providers)
   - Moddle extensions for custom properties
3. **Lifecycle Management**: Attaches modeler to DOM in `ngAfterContentInit()` and cleans up in `ngOnDestroy()`

### Custom Properties System

The application includes a custom properties provider system:

- **Provider**: `src/app/custom-properties-provider/custom-property-provider.js`
- **Properties**: `src/app/custom-properties-provider/properties/custom-properties.js`
- **Descriptors**: `src/app/custom-properties-provider/descriptors/custom.json`

Custom properties are added specifically to Start Events and use the `TextFieldEntry` component for property editing.

### Key Dependencies

- **Angular 19.x**: Core framework
- **Angular Material 19.x**: Material Design UI components
- **Angular CDK 19.x**: Component Development Kit
- **bpmn-js**: BPMN diagram modeling library
- **bpmn-js-properties-panel**: Properties panel for BPMN elements
- **@bpmn-io/properties-panel**: UI components for properties
- **camunda-bpmn-moddle**: Camunda extensions support

### Material Design Integration

The application uses Angular Material for UI components:

- **MatTable**: Data grid for process definitions list
- **MatCard**: Container cards with headers and content
- **MatToolbar**: Top navigation bar
- **MatButton**: Action buttons throughout the app
- **MatIcon**: Material Design icons
- **MatChip**: Status indicators and badges
- **MatMenu**: Dropdown action menus
- **MatSpinner**: Loading indicators
- **MatTooltip**: Helpful tooltips

### Process List Component

- **ProcessListComponent** (`src/app/process-list/process-list.component.ts`): Displays process definitions in a Material Design table
  - Fetches data from `http://localhost:8080/api/process-definitions`
  - Shows process name, key, version, status, and capabilities
  - Includes action menus for each process
  - Clickable process names navigate to detail view
  - Responsive design with proper loading states

### Process Detail Component

- **ProcessDetailComponent** (`src/app/process-detail/process-detail.component.ts`): Shows detailed information for a single process definition
  - Accessible via `/processes/:id` route
  - Displays comprehensive process information including identifiers, capabilities, and metadata
  - Action buttons for starting processes and viewing diagrams
  - **Suspend/Activate Functionality**: Toggle process definition active state
  - **API Integration**: Uses `PUT /api/process-definitions/{id}/suspend` and `/activate`
  - **Confirmation Dialogs**: Native confirmation for suspend/activate actions
  - **Visual Status Indicators**: Enhanced status display with icons and color coding
  - **Loading States**: Professional feedback during suspend/activate operations
  - Material Design cards layout with proper navigation
  - Back button to return to process list

### Build Configuration

- Uses Angular CLI with application builder
- Custom style imports for BPMN.js CSS assets
- Bootstrap integration for styling
- Karma/Jasmine for testing
- TypeScript configuration with strict settings