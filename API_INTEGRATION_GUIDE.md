# API Integration Guide for BPMN Form Mapping

## Overview
This guide shows how to integrate your BPMN form mapping with the Swagger API at `http://localhost:8080/swagger-ui/index.html#/`.

## API Services Created

### 1. TaskApiService
Handles all task-related API operations:

```typescript
// Get task by ID
this.taskApiService.getTask('task_123').subscribe(task => {
  console.log('Task:', task);
});

// Get tasks for a process instance
this.taskApiService.getTasksForProcessInstance('process_456').subscribe(tasks => {
  console.log('Tasks:', tasks.data);
});

// Complete task with form data
const formData = {
  taskId: 'task_123',
  processInstanceId: 'process_456',
  variables: {
    approved: { value: true, type: 'Boolean' },
    comments: { value: 'Approved by manager', type: 'String' }
  }
};
this.taskApiService.completeTask('task_123', formData).subscribe(result => {
  console.log('Task completed:', result);
});
```

### 2. Updated FormMappingService
Now uses real API endpoints with fallback to mock data:

```typescript
// Loads real task data from API
this.formMappingService.getFormForTask('task_123').subscribe(mapping => {
  console.log('Form mapping:', mapping);
  // mapping contains: taskId, processInstanceId, formKey, formType, variables
});

// Submits to real API
this.formMappingService.submitFormData(submissionData).subscribe(result => {
  console.log('Submission result:', result);
});
```

## API Endpoints Assumed

Based on common Flowable/Camunda patterns, the following endpoints are configured:

### Task Management
- `GET /api/tasks` - Get tasks with query parameters
- `GET /api/tasks/{taskId}` - Get specific task
- `GET /api/tasks/{taskId}/form-data` - Get task form data
- `POST /api/tasks/{taskId}/complete` - Complete task
- `PUT /api/tasks/{taskId}/form-data` - Save task form data
- `POST /api/tasks/{taskId}/claim` - Claim task
- `POST /api/tasks/{taskId}/unclaim` - Unclaim task

### Form Management
- `GET /api/forms/{formKey}` - Get form definition
- `GET /api/forms/{formKey}/schema` - Get form schema
- `GET /api/tasks/{taskId}/form` - Render task form

### Variables
- `GET /api/tasks/{taskId}/variables` - Get task variables
- `PUT /api/tasks/{taskId}/variables` - Set task variables

## Usage in BPMN Diagram

### 1. Configure User Task Properties
1. Add User Task to BPMN diagram
2. Set properties in Form Mapping panel:
   ```
   Form Key: orderApprovalForm
   Form Type: embedded
   Form Reference: (optional)
   ```

### 2. Navigate to Form
- **Double-click User Task** → Opens form with real API data
- URL generated: `/form?taskId=task_123&processInstanceId=process_456&formKey=orderApprovalForm`

### 3. Form Component Integration
The FormComponent now:
- Loads real task data from API
- Falls back to mock data if API unavailable
- Submits to real API endpoints
- Shows appropriate error handling

## Error Handling

All services include comprehensive error handling:

```typescript
// API call with fallback
this.taskApiService.getTask(taskId).pipe(
  catchError(error => {
    console.error('API unavailable, using mock data:', error);
    return of(mockTaskData);
  })
).subscribe(task => {
  // Process task data (real or mock)
});
```

## API Data Models

### TaskResponse
```typescript
interface TaskResponse {
  id: string;
  name: string;
  processInstanceId: string;
  formKey?: string;
  variables?: { [key: string]: TaskVariable };
  // ... other fields
}
```

### TaskVariable
```typescript
interface TaskVariable {
  value: any;
  type: string; // 'String', 'Boolean', 'Integer', etc.
  valueInfo?: { [key: string]: any };
}
```

## Testing API Integration

### 1. Check API Availability
```typescript
// The services will automatically fall back to mock data if API is unavailable
// Check browser console for API call attempts and fallback messages
```

### 2. Monitor Network Tab
- Open browser DevTools → Network tab
- Double-click User Task in BPMN diagram
- Look for API calls to `http://localhost:8080/api/*`

### 3. Swagger UI Verification
- Open `http://localhost:8080/swagger-ui/index.html#/`
- Test endpoints manually to verify they match our service calls
- Check response formats match our models

## Customization

### Update Base URL
```typescript
// In task-api.service.ts
private readonly baseUrl = 'http://your-api-server:port/api';
```

### Add Custom Headers
```typescript
// In task-api.service.ts
private readonly httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  })
};
```

### Modify API Paths
Update the endpoint paths in `TaskApiService` methods to match your actual API structure.

## Benefits

1. **Real-time Data**: Forms load actual task data from your process engine
2. **Seamless Integration**: BPMN User Tasks directly connected to your API
3. **Fallback Support**: Continues working even if API is temporarily unavailable
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Error Handling**: Comprehensive error handling and user feedback

The form mapping system now provides a complete bridge between your BPMN diagrams and your backend API!