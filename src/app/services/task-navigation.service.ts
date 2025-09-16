import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface TaskFormMapping {
  taskId: string;
  taskName: string;
  formKey?: string;
  formRef?: string;
  formType?: string;
  processInstanceId?: string;
  processName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskNavigationService {

  constructor(private router: Router) { }

  /**
   * Navigates to the form component for a specific User Task
   */
  navigateToTaskForm(mapping: TaskFormMapping, mode: 'editor' | 'viewer' = 'editor'): void {
    console.log('TaskNavigationService.navigateToTaskForm called with mapping:', mapping);
    
    // Use formKey as form name if available, otherwise fallback to taskName
    const formName = mapping.formKey || mapping.taskName || 'Task Form';
    
    const queryParams: any = {
      taskId: mapping.taskId,
      formName: formName,
      mode: mode // Default to editor mode for form creation/editing
    };

    // Add process instance ID if available
    if (mapping.processInstanceId) {
      queryParams.processInstanceId = mapping.processInstanceId;
    }

    // Add process name if available
    if (mapping.processName) {
      queryParams.processName = mapping.processName;
    }

    // Add form configuration if available
    if (mapping.formKey) {
      queryParams.formKey = mapping.formKey;
    }
    if (mapping.formRef) {
      queryParams.formRef = mapping.formRef;
    }
    if (mapping.formType) {
      queryParams.formType = mapping.formType;
    }

    // Navigate to form component with task parameters
    console.log('Final queryParams for form navigation:', queryParams);
    this.router.navigate(['/form'], { queryParams });
  }

  /**
   * Extracts task form mapping from a BPMN User Task element
   */
  extractTaskFormMapping(element: any, processInstanceId?: string, processName?: string): TaskFormMapping {
    const businessObject = element.businessObject;
    
    return {
      taskId: businessObject.id,
      taskName: businessObject.name || businessObject.id,
      formKey: businessObject.get ? businessObject.get('flowable:formKey') : businessObject['flowable:formKey'],
      formRef: businessObject.get ? businessObject.get('flowable:formRef') : businessObject['flowable:formRef'],
      formType: businessObject.get ? businessObject.get('flowable:formType') : businessObject['flowable:formType'],
      processInstanceId: processInstanceId,
      processName: processName
    };
  }

  /**
   * Creates a URL for task form navigation
   */
  createTaskFormUrl(mapping: TaskFormMapping): string {
    const queryParams = new URLSearchParams();
    
    // Use formKey as form name if available, otherwise fallback to taskName
    const formName = mapping.formKey || mapping.taskName || 'Task Form';
    
    queryParams.set('taskId', mapping.taskId);
    queryParams.set('formName', formName);
    queryParams.set('mode', 'editor');

    if (mapping.processInstanceId) {
      queryParams.set('processInstanceId', mapping.processInstanceId);
    }
    if (mapping.processName) {
      queryParams.set('processName', mapping.processName);
    }
    if (mapping.formKey) {
      queryParams.set('formKey', mapping.formKey);
    }
    if (mapping.formRef) {
      queryParams.set('formRef', mapping.formRef);
    }
    if (mapping.formType) {
      queryParams.set('formType', mapping.formType);
    }

    return `/form?${queryParams.toString()}`;
  }

  /**
   * Checks if a BPMN element has form configuration
   */
  hasFormConfiguration(element: any): boolean {
    if (!element || !element.businessObject) {
      return false;
    }

    const businessObject = element.businessObject;
    const formKey = businessObject.get ? businessObject.get('flowable:formKey') : businessObject['flowable:formKey'];
    const formRef = businessObject.get ? businessObject.get('flowable:formRef') : businessObject['flowable:formRef'];
    
    return !!(formKey || formRef);
  }

  /**
   * Gets form configuration summary for display
   */
  getFormSummary(element: any): string {
    if (!this.hasFormConfiguration(element)) {
      return 'No form configured';
    }

    const businessObject = element.businessObject;
    const formKey = businessObject.get ? businessObject.get('flowable:formKey') : businessObject['flowable:formKey'];
    const formRef = businessObject.get ? businessObject.get('flowable:formRef') : businessObject['flowable:formRef'];
    const formType = businessObject.get ? businessObject.get('flowable:formType') : businessObject['flowable:formType'];

    if (formKey) {
      return `Form: ${formKey}`;
    } else if (formRef) {
      return `Form Ref: ${formRef}`;
    } else if (formType) {
      return `Form Type: ${formType}`;
    }

    return 'Form configured';
  }
}