# Flowable Forms API Integration

## Overview
Complete integration with Flowable-specific form APIs at `http://localhost:8080/api/flowable-forms/*`. All services have been updated to use the new endpoint structure.

## Updated API Endpoints

### 📋 Form Loading API

#### Get Existing Form
```http
GET /api/flowable-forms/{formKey}
```
**Usage**: Loads complete form definition including schema and metadata
```typescript
this.formDeploymentService.loadFormFromServer('orderForm').subscribe(form => {
  console.log('Loaded form:', form);
});
```

#### Check Form Existence
```http
GET /api/flowable-forms/{formKey}/exists
```
**Usage**: Checks if a form exists before attempting to load
```typescript
this.formDeploymentService.checkFormExists('orderForm').subscribe(exists => {
  console.log('Form exists:', exists);
});
```

#### Get All Forms List
```http
GET /api/flowable-forms/list
```
**Usage**: Retrieves list of all available forms
```typescript
this.formDeploymentService.getAllForms().subscribe(forms => {
  console.log('All forms:', forms);
});
// Also available via button in form editor: "List Forms"
```

### 🚀 Form Deployment API

#### Deploy New Form
```http
POST /api/flowable-forms/deploy
```
**Payload**:
```json
{
  "formKey": "orderForm",
  "name": "Order Processing Form",
  "schema": { /* form-js schema */ },
  "taskDefinitionKey": "fulfillOrder",
  "processDefinitionId": "process_123"
}
```
**Usage**: Deploys new form from BPMN form editor
```typescript
// Triggered by "Deploy Form" button in task-based form editor
this.deployFormToServer(); // Method in FormComponent
```

#### Update Existing Form
```http
PUT /api/flowable-forms/{formKey}
```
**Payload**: Same as deploy
**Usage**: Updates existing form from editor
```typescript
// Triggered by "Update Form" button when form already exists
this.deployFormToServer(); // Automatically detects existing vs new
```

#### Delete Form
```http
DELETE /api/flowable-forms/{formKey}
```
**Usage**: Removes form from server
```typescript
this.formDeploymentService.deleteForm('orderForm').subscribe(result => {
  console.log('Deletion result:', result);
});
```

### 📊 Additional APIs

#### Get Form Properties
```http
GET /api/flowable-forms/{formKey}/properties
```
**Usage**: Gets form metadata and properties
```typescript
this.formDeploymentService.getFormProperties('orderForm').subscribe(props => {
  console.log('Form properties:', props);
});
```

#### Get Form Schema Only
```http
GET /api/flowable-forms/{formKey}/schema
```
**Usage**: Gets just the form schema without metadata
```typescript
this.formDeploymentService.getFormSchema('orderForm').subscribe(schema => {
  console.log('Form schema:', schema);
});
```

## Service Integration

### FormDeploymentService
**All methods updated to use `/api/flowable-forms/*` endpoints:**
- `loadFormFromServer()` → `GET /api/flowable-forms/{formKey}`
- `deployForm()` → `POST /api/flowable-forms/deploy`
- `updateForm()` → `PUT /api/flowable-forms/{formKey}`
- `deleteForm()` → `DELETE /api/flowable-forms/{formKey}`
- `getAllForms()` → `GET /api/flowable-forms/list`
- `getFormProperties()` → `GET /api/flowable-forms/{formKey}/properties`
- `getFormSchema()` → `GET /api/flowable-forms/{formKey}/schema`

### TaskApiService
**Form-related methods updated:**
- `getFormByKey()` → `GET /api/flowable-forms/{formKey}`
- `getFormSchema()` → `GET /api/flowable-forms/{formKey}/schema`
- `getFormProperties()` → `GET /api/flowable-forms/{formKey}/properties`
- `getAllForms()` → `GET /api/flowable-forms/list`

## User Workflow with New APIs

### 1. Form Editor Workflow
```
1. Double-click User Task in BPMN diagram
   ↓
2. Check if form exists: GET /api/flowable-forms/{formKey}/exists
   ↓
3a. If exists: Load form: GET /api/flowable-forms/{formKey}
3b. If not exists: Create blank form
   ↓
4. User designs form in editor
   ↓
5. Deploy form: POST /api/flowable-forms/deploy
   ↓
6. Success → Navigate back to diagram
```

### 2. Form Loading Logic
```typescript
// In FormComponent.loadFormFromServerOrCreateNew()
this.formDeploymentService.loadFormFromServer(formKey).subscribe({
  next: (formResponse) => {
    if (formResponse.exists) {
      // Load existing form from server
      this.currentSchema = formResponse.schema;
      this.formExists = true;
    } else {
      // Create new blank form
      this.currentSchema = this.getDefaultFormSchema();
      this.formExists = false;
    }
  }
});
```

### 3. Form Deployment Logic
```typescript
// In FormComponent.deployFormToServer()
if (this.formExists) {
  // Update existing form
  result = await this.formDeploymentService.updateForm(formKey, request).toPromise();
} else {
  // Deploy new form
  result = await this.formDeploymentService.deployForm(request).toPromise();
}
```

## Error Handling & Fallbacks

### API Unavailable Fallback
All services include comprehensive error handling:
```typescript
.pipe(
  catchError(error => {
    console.error('API unavailable:', error);
    // Return mock/default data
    return of(defaultResponse);
  })
)
```

### User Feedback
- **Loading States**: Spinners during API calls
- **Success Messages**: "Form deployed successfully!"
- **Error Messages**: "Failed to deploy form: API unavailable"
- **Fallback Notifications**: "Creating new form - server unavailable"

## UI Features

### Form Editor UI
- **Status Badge**: Shows "New Form" vs "Existing Form"
- **Deploy Button**: Changes text based on form existence
- **List Forms Button**: Shows all forms from server
- **Draft Save**: Saves work in progress
- **Cancel**: Returns to diagram with confirmation

### Network Monitoring
- All API calls logged to console
- Network tab shows actual HTTP requests
- Fallback behavior clearly indicated in UI

## Testing Your Integration

### 1. API Server Status
```bash
# Ensure your API server is running on port 8080
curl http://localhost:8080/api/flowable-forms/list
```

### 2. Form Editor Flow
1. Open BPMN diagram
2. Double-click User Task
3. Check browser Network tab for API calls:
   - `GET /api/flowable-forms/{formKey}/exists`
   - `GET /api/flowable-forms/{formKey}` (if exists)
4. Design form and click "Deploy"
5. Check for deployment API call:
   - `POST /api/flowable-forms/deploy`

### 3. Error Testing
- Stop API server
- Try form operations
- Should see fallback messages and continue working

## Benefits of New Integration

1. **Flowable-Specific**: Uses dedicated Flowable form endpoints
2. **Complete CRUD**: Create, Read, Update, Delete forms
3. **Metadata Support**: Form properties and schema endpoints
4. **List Management**: View all available forms
5. **Robust Fallbacks**: Works offline with mock data
6. **User Experience**: Clear feedback and error handling

Your form editor now provides a complete integration with Flowable's form management system!