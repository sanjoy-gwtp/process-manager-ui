import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { TaskApiService } from './task-api.service';
import { TaskResponse, TaskVariable } from '../models/api.models';

export interface FormTaskMapping {
  taskId: string;
  taskName?: string;
  processInstanceId: string;
  formKey?: string;
  formRef?: string;
  formType: 'embedded' | 'external' | 'generated' | 'custom';
  variables: { [key: string]: any };
}

export interface FormSubmissionData {
  taskId: string;
  processInstanceId: string;
  variables: { [key: string]: any };
}

@Injectable({
  providedIn: 'root'
})
export class FormMappingService {

  constructor(private taskApiService: TaskApiService) { }

  /**
   * Gets form configuration for a specific user task
   */
  getFormForTask(taskId: string): Observable<FormTaskMapping | null> {
    return this.taskApiService.getTask(taskId).pipe(
      switchMap((task: TaskResponse) => {
        // Get form data for the task
        return this.taskApiService.getTaskFormData(taskId).pipe(
          map((formData: { [key: string]: TaskVariable }) => {
            const mapping: FormTaskMapping = {
              taskId: task.id,
              taskName: task.name,
              processInstanceId: task.processInstanceId,
              formKey: task.formKey,
              formType: this.determineFormType(task.formKey),
              variables: this.convertTaskVariablesToFormData(formData)
            };
            return mapping;
          }),
          catchError(() => {
            // Fallback if form data API fails
            const mapping: FormTaskMapping = {
              taskId: task.id,
              taskName: task.name,
              processInstanceId: task.processInstanceId,
              formKey: task.formKey,
              formType: this.determineFormType(task.formKey),
              variables: {}
            };
            return of(mapping);
          })
        );
      }),
      catchError((error) => {
        console.error('Error fetching task:', error);
        // Return mock data as fallback - preserve original task structure
        const mockMapping: FormTaskMapping = {
          taskId: taskId,
          processInstanceId: 'orderProcess:2:ad4404c7-8571-11f0-b93b-4a92a0e0ae0f',
          formKey: undefined, // Don't override formKey - let it be generated from taskId
          formType: 'custom',
          variables: {
            requestType: '',
            priority: 'medium',
            comments: '',
            approved: false
          }
        };
        console.log('Using mock fallback data for task:', taskId);
        return of(mockMapping);
      })
    );
  }

  /**
   * Submits form data back to the process engine
   */
  submitFormData(submissionData: FormSubmissionData): Observable<any> {
    console.log('Submitting form data to API:', submissionData);
    
    // Convert form variables to API format
    const apiFormData = {
      taskId: submissionData.taskId,
      processInstanceId: submissionData.processInstanceId,
      variables: this.convertFormVariablesToTaskVariables(submissionData.variables)
    };

    return this.taskApiService.completeTask(submissionData.taskId, apiFormData).pipe(
      map((response) => ({
        success: true,
        taskId: submissionData.taskId,
        processInstanceId: submissionData.processInstanceId,
        message: 'Task completed successfully',
        response: response
      })),
      catchError((error) => {
        console.error('Error submitting form data:', error);
        // Return mock response as fallback
        return of({
          success: false,
          taskId: submissionData.taskId,
          processInstanceId: submissionData.processInstanceId,
          message: 'Failed to complete task - using mock response',
          error: error.message || 'Unknown error'
        });
      })
    );
  }

  /**
   * Maps form schema variables to process variables
   */
  mapFormToProcessVariables(formData: any, schema: any): { [key: string]: any } {
    const processVariables: { [key: string]: any } = {};

    if (schema && schema.components) {
      schema.components.forEach((component: any) => {
        const key = component.key;
        if (formData.hasOwnProperty(key)) {
          processVariables[key] = {
            value: formData[key],
            type: this.determineVariableType(formData[key]),
            valueInfo: {}
          };
        }
      });
    }

    return processVariables;
  }

  /**
   * Determines the Camunda variable type based on the value
   */
  private determineVariableType(value: any): string {
    if (typeof value === 'boolean') {
      return 'Boolean';
    } else if (typeof value === 'number') {
      return Number.isInteger(value) ? 'Integer' : 'Double';
    } else if (typeof value === 'string') {
      return 'String';
    } else if (value instanceof Date) {
      return 'Date';
    } else if (typeof value === 'object') {
      return 'Json';
    }
    return 'String';
  }

  /**
   * Generates a form schema based on process variables
   */
  generateFormSchemaFromVariables(variables: { [key: string]: any }): any {
    const components = Object.keys(variables).map(key => {
      const variable = variables[key];
      return {
        key: key,
        label: this.humanizeLabel(key),
        type: this.mapVariableTypeToFormComponent(variable.type || 'String'),
        value: variable.value
      };
    });

    return {
      type: 'default',
      id: `generated_form_${Date.now()}`,
      components: components
    };
  }

  /**
   * Maps Camunda variable types to form component types
   */
  private mapVariableTypeToFormComponent(variableType: string): string {
    switch (variableType.toLowerCase()) {
      case 'boolean':
        return 'checkbox';
      case 'integer':
      case 'double':
        return 'number';
      case 'date':
        return 'datetime';
      case 'json':
        return 'textarea';
      default:
        return 'textfield';
    }
  }

  /**
   * Converts camelCase or snake_case to human readable labels
   */
  private humanizeLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  /**
   * Validates form data against business rules
   */
  validateFormData(formData: any, schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (schema && schema.components) {
      schema.components.forEach((component: any) => {
        const key = component.key;
        const value = formData[key];

        // Check required fields
        if (component.validate?.required && (!value || value === '')) {
          errors.push(`${component.label || key} is required`);
        }

        // Check email format
        if (component.subtype === 'email' && value && !this.isValidEmail(value)) {
          errors.push(`${component.label || key} must be a valid email address`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Determines form type from form key
   */
  private determineFormType(formKey?: string): 'embedded' | 'external' | 'generated' | 'custom' {
    if (!formKey) return 'generated';
    
    if (formKey.startsWith('embedded:')) {
      return 'embedded';
    } else if (formKey.includes('://') || formKey.startsWith('http')) {
      return 'external';
    } else {
      return 'custom';
    }
  }

  /**
   * Converts TaskVariable objects to simple form data
   */
  private convertTaskVariablesToFormData(taskVariables: { [key: string]: TaskVariable }): { [key: string]: any } {
    const formData: { [key: string]: any } = {};
    
    Object.keys(taskVariables).forEach(key => {
      const variable = taskVariables[key];
      formData[key] = variable.value;
    });
    
    return formData;
  }

  /**
   * Converts simple form variables to TaskVariable objects
   */
  private convertFormVariablesToTaskVariables(formVariables: { [key: string]: any }): { [key: string]: TaskVariable } {
    const taskVariables: { [key: string]: TaskVariable } = {};
    
    Object.keys(formVariables).forEach(key => {
      const value = formVariables[key];
      taskVariables[key] = {
        value: value,
        type: this.determineVariableType(value),
        valueInfo: {}
      };
    });
    
    return taskVariables;
  }
}