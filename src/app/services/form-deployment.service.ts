import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface FormDeploymentRequest {
  formKey: string;
  formName: string;
  formSchema: any;
  taskId: string;
  processDefinitionId?: string;
  overrideExisting?: boolean;
}

export interface FormDeploymentResponse {
  success: boolean;
  formId?: string;
  formKey: string;
  message: string;
  deploymentId?: string;
  requiresOverride?: boolean;
}

export interface FormLoadResponse {
  formKey: string;
  formName: string;
  schema: any;
  exists: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FormDeploymentService {

  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  /**
   * Checks if a form exists on the server by form key
   */
  checkFormExists(formKey: string): Observable<boolean> {
    const url = `${this.baseUrl}/flowable-forms/${formKey}/exists`;
    console.log('Checking form exists API call:', url);
    
    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('Form exists API response:', response);
        return response.exists || false;
      }),
      catchError(error => {
        console.log('Form exists API error:', error);
        return of(false);
      })
    );
  }

  /**
   * Loads an existing form from the server
   */
  loadFormFromServer(formKey: string): Observable<FormLoadResponse> {
    return this.http.get<any>(`${this.baseUrl}/flowable-forms/${formKey}`).pipe(
      map(response => ({
        formKey: response.key || formKey,
        formName: response.name || 'Loaded Form',
        schema: response.schema || this.getDefaultFormSchema(),
        exists: true
      })),
      catchError(() => {
        // Return blank form if not found
        return of({
          formKey: formKey,
          formName: 'New Form',
          schema: this.getDefaultFormSchema(),
          exists: false
        });
      })
    );
  }

  /**
   * Deploys a form to the server
   */
  deployForm(deploymentRequest: FormDeploymentRequest): Observable<FormDeploymentResponse> {
    console.log('Deploying form to server:', deploymentRequest);

    const payload = {
      formKey: deploymentRequest.formKey,
      name: deploymentRequest.formName,
      schema: deploymentRequest.formSchema,
      taskDefinitionKey: deploymentRequest.taskId,
      processDefinitionId: deploymentRequest.processDefinitionId,
      overrideExisting: deploymentRequest.overrideExisting || false
    };

    return this.http.post<any>(`${this.baseUrl}/flowable-forms/deploy`, payload).pipe(
      map(response => ({
        success: true,
        formId: response.id,
        formKey: deploymentRequest.formKey,
        message: `Form "${deploymentRequest.formName}" deployed successfully`,
        deploymentId: response.deploymentId
      })),
      catchError(error => {
        console.error('Form deployment failed:', error);
        
        // Extract error message from various possible error structures
        const errorMessage = this.extractErrorMessage(error);
        console.log('Extracted error message:', errorMessage);
        
        // Check for specific override error patterns
        if (this.isOverrideRequiredError(errorMessage)) {
          // Try to extract form name from error for better user feedback
          const formNameFromError = this.extractFormNameFromError(errorMessage);
          const displayFormName = formNameFromError || deploymentRequest.formKey;
          
          return of({
            success: false,
            formKey: deploymentRequest.formKey,
            message: `Form "${displayFormName}" already exists on server. Use override to update existing form.`,
            requiresOverride: true
          });
        }
        
        return of({
          success: false,
          formKey: deploymentRequest.formKey,
          message: errorMessage.startsWith('Failed to deploy form:') ? errorMessage : `Failed to deploy form: ${errorMessage}`
        });
      })
    );
  }

  /**
   * Updates an existing form on the server
   */
  updateForm(formKey: string, deploymentRequest: FormDeploymentRequest): Observable<FormDeploymentResponse> {
    console.log('Updating form on server:', formKey, deploymentRequest);

    const payload = {
      formKey: deploymentRequest.formKey,
      name: deploymentRequest.formName,
      schema: deploymentRequest.formSchema,
      taskDefinitionKey: deploymentRequest.taskId,
      processDefinitionId: deploymentRequest.processDefinitionId,
      overrideExisting: deploymentRequest.overrideExisting || true // Default to true for updates
    };

    return this.http.put<any>(`${this.baseUrl}/flowable-forms/${formKey}`, payload).pipe(
      map(response => ({
        success: true,
        formId: response.id,
        formKey: deploymentRequest.formKey,
        message: `Form "${deploymentRequest.formName}" updated successfully`,
        deploymentId: response.deploymentId
      })),
      catchError(error => {
        console.error('Form update failed:', error);
        
        const errorMessage = this.extractErrorMessage(error);
        console.log('Update error message:', errorMessage);
        
        return of({
          success: false,
          formKey: deploymentRequest.formKey,
          message: errorMessage.startsWith('Failed to update form:') ? errorMessage : `Failed to update form: ${errorMessage}`
        });
      })
    );
  }

  /**
   * Saves form as draft without deploying
   */
  saveFormDraft(formKey: string, formSchema: any): Observable<{ success: boolean; message: string }> {
    const payload = {
      formKey: formKey,
      schema: formSchema,
      draft: true
    };

    return this.http.post<any>(`${this.baseUrl}/flowable-forms/${formKey}/draft`, payload).pipe(
      map(() => ({
        success: true,
        message: 'Form draft saved successfully'
      })),
      catchError(error => {
        console.error('Draft save failed:', error);
        return of({
          success: false,
          message: `Failed to save draft: ${error.error?.message || error.message || 'Unknown error'}`
        });
      })
    );
  }

  /**
   * Gets list of all forms
   */
  getAllForms(): Observable<any[]> {
    const url = `${this.baseUrl}/flowable-forms/list`;
    console.log('🌐 Fetching forms from URL:', url);
    
    return this.http.get<any[]>(url).pipe(
      map(response => {
        console.log('📨 getAllForms API response:', response);
        console.log('📋 Response type:', typeof response);
        console.log('🔍 Is array:', Array.isArray(response));
        return response;
      }),
      catchError(error => {
        console.error('❌ Failed to get forms list:', error);
        console.log('🔍 Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        return of([]);
      })
    );
  }

  /**
   * Gets form properties by form key
   */
  getFormProperties(formKey: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/flowable-forms/${formKey}/properties`).pipe(
      catchError(error => {
        console.error('Failed to get form properties:', error);
        return of({});
      })
    );
  }

  /**
   * Gets form schema by form key
   */
  getFormSchema(formKey: string): Observable<any> {
    const url = `${this.baseUrl}/flowable-forms/${formKey}/schema`;
    console.log('Loading form schema from URL:', url);
    
    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('Form schema API response:', response);
        
        // The API returns { schema: {...}, formKey: "..." }
        // We need to extract just the schema part for Form.js
        if (response && response.schema) {
          console.log('✅ Extracting schema from API response:', response.schema);
          return response.schema;
        } else if (response && response.components) {
          // If response is already a schema (fallback for different API formats)
          console.log('✅ Using response as schema directly:', response);
          return response;
        } else {
          console.warn('⚠️ Invalid schema format from API, using default schema');
          return this.getDefaultFormSchema();
        }
      }),
      catchError(error => {
        console.error('Failed to get form schema from:', url, 'Error:', error);
        console.log('Using default form schema as fallback');
        return of(this.getDefaultFormSchema());
      })
    );
  }

  /**
   * Deletes a form by form key
   */
  deleteForm(formKey: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<any>(`${this.baseUrl}/flowable-forms/${formKey}`).pipe(
      map(() => ({
        success: true,
        message: `Form "${formKey}" deleted successfully`
      })),
      catchError(error => {
        console.error('Form deletion failed:', error);
        return of({
          success: false,
          message: `Failed to delete form: ${error.error?.message || error.message || 'Unknown error'}`
        });
      })
    );
  }

  /**
   * Navigates back to the diagram page
   */
  navigateBackToDiagram(processId?: string, processName?: string): void {
    const queryParams: any = { returnFromForm: 'true' };
    
    if (processId) {
      // Check if processId is already in the correct format (processKey:version:instanceId)
      if (processId.includes(':') && processId.split(':').length >= 3) {
        // Already in correct format, use as-is
        queryParams.processId = processId;
        console.log('Using processId as-is (already in correct format):', processId);
      } else {
        // Parse the process ID to get the proper format
        const processInfo = this.parseProcessInfo(processId);
        queryParams.processId = processInfo.displayName;
        
        console.log('Navigating back to diagram with parsed processId:', {
          original: processId,
          parsed: processInfo.displayName,
          processInfo: processInfo
        });
      }
    }
    
    if (processName) {
      queryParams.processName = processName;
    }

    console.log('Final navigation queryParams:', queryParams);
    this.router.navigate(['/diagram'], { queryParams });
  }

  /**
   * Gets default form schema for new forms
   */
  private getDefaultFormSchema(): any {
    return {
      type: 'default',
      id: `form_${Date.now()}`,
      components: [
        {
          key: 'textfield_1',
          label: 'Name',
          type: 'textfield',
          validate: {
            required: true
          }
        },
        {
          key: 'textarea_1',
          label: 'Comments',
          type: 'textarea',
          rows: 3
        }
      ]
    };
  }

  /**
   * Generates a form key based on task ID
   */
  generateFormKey(taskId: string): string {
    return `${taskId}_form`;
  }

  /**
   * Extracts error message from various error response structures including RuntimeException
   */
  private extractErrorMessage(error: any): string {
    console.log('Full error object:', JSON.stringify(error, null, 2));
    
    // Try different possible error message locations
    const possibleMessages = [
      error.error?.message,           // Standard HTTP error response
      error.error?.error,             // Some APIs nest error in error.error
      error.error?.exception,         // Java exception message
      error.error?.cause?.message,    // Nested exception message
      error.error,                    // Direct error string
      error.message,                  // Error object message
      error.statusText,               // HTTP status text
      error                           // Direct error string
    ];

    for (const msg of possibleMessages) {
      if (typeof msg === 'string' && msg.trim().length > 0) {
        let cleanMessage = msg.trim();
        
        // Handle RuntimeException format: "java.lang.RuntimeException: Failed to deploy form: ..."
        if (cleanMessage.startsWith('java.lang.RuntimeException:')) {
          cleanMessage = cleanMessage.replace('java.lang.RuntimeException: ', '');
        }
        
        // Handle other exception prefixes
        if (cleanMessage.includes(': ') && cleanMessage.match(/^[\w\.]+Exception:/)) {
          const colonIndex = cleanMessage.indexOf(': ');
          cleanMessage = cleanMessage.substring(colonIndex + 2);
        }
        
        console.log('Extracted error message:', cleanMessage);
        return cleanMessage;
      }
    }

    return 'Unknown error occurred';
  }

  /**
   * Checks if error message indicates override is required
   */
  private isOverrideRequiredError(errorMessage: string): boolean {
    console.log('Checking override requirement for message:', errorMessage);
    
    const overridePatterns = [
      // Direct override messages
      'Use overrideExisting=true to update',
      'overrideExisting=true',
      'override',
      // Form existence patterns
      'Form already exists:',
      'already exists',
      'Failed to deploy form: Form already exists',
      // Deployment conflict patterns
      'deployment conflict',
      'duplicate form',
      'form conflict',
      // Flowable/Camunda specific patterns
      'FormDefinition with key',
      'definition already exists',
      'resource already deployed'
    ];

    const lowerMessage = errorMessage.toLowerCase();
    const isOverrideRequired = overridePatterns.some(pattern => lowerMessage.includes(pattern.toLowerCase()));
    
    console.log('Override required?', isOverrideRequired);
    return isOverrideRequired;
  }

  /**
   * Extracts form name from error message for better user feedback
   */
  private extractFormNameFromError(errorMessage: string): string | null {
    // Pattern: "Form already exists: form-name" or "Failed to deploy form: Form already exists: form-name"
    const patterns = [
      /Form already exists:\s*([^\s\.]+)/i,
      /form[\s"]*([^\s"\.]+)[\s"]*already exists/i,
      /exists:\s*([^\s\.\,]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  /**
   * Parses process ID to extract process key, version, and instance ID
   * Handles formats like: process_123, processKey:version:instanceId, etc.
   */
  parseProcessInfo(processId: string): { processKey: string; version?: string; instanceId?: string; displayName: string } {
    console.log('parseProcessInfo called with:', processId);
    
    if (!processId) {
      console.log('No processId provided, returning unknown');
      return { processKey: 'unknown', displayName: 'Unknown Process' };
    }

    // Check if it's in the format processKey:version:instanceId
    if (processId.includes(':')) {
      console.log('Found colon format, parsing...');
      const parts = processId.split(':');
      if (parts.length >= 3) {
        const [processKey, version, instanceId] = parts;
        const result = {
          processKey: processKey,
          version: version,
          instanceId: instanceId,
          displayName: `${processKey}:${version}:${instanceId}`
        };
        console.log('Full colon format parsing result:', result);
        return result;
      } else if (parts.length === 2) {
        const [processKey, version] = parts;
        return {
          processKey: processKey,
          version: version,
          displayName: `${processKey}:${version}`
        };
      }
    }

    // Handle simple formats like process_123
    if (processId.includes('_')) {
      console.log('Found underscore format, parsing...');
      const parts = processId.split('_');
      const processKey = parts[0];
      const instanceId = parts[1];
      const result = {
        processKey: processKey,
        instanceId: instanceId,
        displayName: `${processKey}:1:${instanceId}` // Default version to 1
      };
      console.log('Underscore parsing result:', result);
      return result;
    }

    // Fallback for unknown formats
    console.log('Using fallback format');
    return {
      processKey: processId,
      displayName: processId
    };
  }

  /**
   * Validates form schema before deployment
   */
  validateFormSchema(schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema) {
      errors.push('Form schema is required');
      return { valid: false, errors };
    }

    if (!schema.components || !Array.isArray(schema.components)) {
      errors.push('Form must have components array');
    }

    if (schema.components && schema.components.length === 0) {
      errors.push('Form must have at least one component');
    }

    // Validate each component has required fields
    if (schema.components) {
      schema.components.forEach((component: any, index: number) => {
        if (!component.key) {
          errors.push(`Component ${index + 1} is missing required 'key' field`);
        }
        if (!component.type) {
          errors.push(`Component ${index + 1} is missing required 'type' field`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}