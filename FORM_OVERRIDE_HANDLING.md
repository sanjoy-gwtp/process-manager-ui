# Form Override Handling

## Problem Solved
When deploying forms to Flowable, you may encounter the error:
```
Form already exists: approval-form. Use overrideExisting=true to update.
```

This has been fully implemented with automatic handling and user confirmation.

## Solution Implementation

### 🔄 Automatic Override Detection
The system now automatically detects override requirement errors and handles them gracefully.

### 📋 API Payload Updates

#### FormDeploymentRequest Interface
```typescript
interface FormDeploymentRequest {
  formKey: string;
  formName: string;
  formSchema: any;
  taskId: string;
  processDefinitionId?: string;
  overrideExisting?: boolean; // New field added
}
```

#### API Payload Structure
```json
{
  "formKey": "approval-form",
  "name": "Approval Form",
  "schema": { /* form-js schema */ },
  "taskDefinitionKey": "approveTask",
  "processDefinitionId": "process_123",
  "overrideExisting": true
}
```

### 🎯 User Experience Flow

#### Step 1: Initial Deployment
```
User clicks "Deploy Form"
    ↓
POST /api/flowable-forms/deploy
{
  "overrideExisting": false
}
    ↓
Server Response: "Form already exists: approval-form. Use overrideExisting=true to update."
```

#### Step 2: Automatic Override Handling
```
System detects override requirement
    ↓
Shows confirmation dialog:
"Form 'approval-form' already exists on the server.
Do you want to override the existing form with your changes?"
    ↓
User clicks "OK"
    ↓
Automatically redeploys with overrideExisting=true
```

#### Step 3: Successful Override
```
POST /api/flowable-forms/deploy
{
  "overrideExisting": true
}
    ↓
Success: "Form 'approval-form' deployed successfully"
    ↓
Navigate back to diagram
```

### 🛡️ Smart Logic

#### New Form Deployment
- `overrideExisting: false` (default)
- If form exists → Show override confirmation
- If user confirms → Redeploy with `overrideExisting: true`

#### Existing Form Updates
- `overrideExisting: true` (always)
- Direct update without confirmation (user already editing existing form)

#### Error Detection
```typescript
// In FormDeploymentService.deployForm()
catchError(error => {
  const errorMessage = error.error?.message || error.message;
  if (errorMessage.includes('overrideExisting=true')) {
    return of({
      success: false,
      formKey: deploymentRequest.formKey,
      message: errorMessage,
      requiresOverride: true // Special flag
    });
  }
  // Regular error handling...
})
```

#### Confirmation Handling
```typescript
// In FormComponent.handleFormOverrideConfirmation()
private handleFormOverrideConfirmation(deploymentResult: any): void {
  const confirmMessage = `Form "${formKey}" already exists on the server.\n\nDo you want to override the existing form with your changes?`;
  
  if (confirm(confirmMessage)) {
    // Redeploy with overrideExisting=true
    this.deployFormToServer(true);
  } else {
    // Show cancellation message
    this.snackBar.open('Form deployment cancelled - existing form was not modified');
  }
}
```

## User Interface Updates

### Button Behavior
- **Deploy Form**: For new forms (may trigger override confirmation)
- **Update Form**: For existing forms (always uses override)

### Messages & Feedback
- **Override Required**: Shows confirmation dialog with clear explanation
- **Cancelled**: "Form deployment cancelled - existing form was not modified"
- **Success**: "Form 'approval-form' deployed successfully"
- **Error**: Detailed error messages from server

### Visual Indicators
- **Loading State**: "Deploying..." with spinner during API calls
- **Status Badge**: Shows "New Form" vs "Existing Form" 
- **Confirmation Dialog**: Native browser confirm dialog with clear messaging

## Error Scenarios Handled

### 1. Form Already Exists (Target Scenario)
```
Initial: overrideExisting=false
Error: "Form already exists: approval-form. Use overrideExisting=true to update."
Action: Show confirmation → User confirms → Retry with overrideExisting=true
Result: Success
```

### 2. User Cancels Override
```
Initial: overrideExisting=false  
Error: Form exists
Action: Show confirmation → User cancels
Result: "Form deployment cancelled - existing form was not modified"
```

### 3. Permission/Other Errors
```
Initial: overrideExisting=false
Error: "Permission denied" or other API error
Action: Show error message directly (no override prompt)
Result: Error displayed to user
```

### 4. Network/Server Errors
```
Initial: overrideExisting=false
Error: Network timeout, server unavailable
Action: Standard error handling
Result: "Deployment failed - check console for details"
```

## Integration Points

### FormDeploymentService Methods
- `deployForm()` - Handles override detection and confirmation
- `updateForm()` - Always uses `overrideExisting: true`

### FormComponent Methods  
- `deployFormToServer()` - Main deployment logic with override parameter
- `handleFormOverrideConfirmation()` - User confirmation dialog

### API Endpoints
- `POST /api/flowable-forms/deploy` - With `overrideExisting` flag
- `PUT /api/flowable-forms/{formKey}` - With `overrideExisting: true`

## Testing the Feature

### 1. Create Form That Exists
1. Double-click User Task with formKey="approval-form"
2. Design form in editor
3. Click "Deploy Form"
4. Should show: "Form 'approval-form' already exists... override?"

### 2. Confirm Override
1. Click "OK" in confirmation dialog
2. Should redeploy with overrideExisting=true
3. Should show success message and navigate back

### 3. Cancel Override
1. Click "Cancel" in confirmation dialog
2. Should show cancellation message
3. Should stay in form editor

### 4. Monitor Network
1. Open browser DevTools → Network tab
2. Watch for API calls with `overrideExisting` parameter
3. First call: `overrideExisting: false`
4. Second call (after confirmation): `overrideExisting: true`

The system now provides a seamless user experience for handling form overrides while maintaining data safety through confirmation dialogs!