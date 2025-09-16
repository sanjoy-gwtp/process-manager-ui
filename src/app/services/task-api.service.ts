import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  TaskResponse, 
  FormData, 
  TaskQueryParams, 
  ApiResponse, 
  TaskVariable,
  FormDefinition 
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class TaskApiService {

  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  /**
   * Gets tasks based on query parameters
   */
  getTasks(queryParams?: TaskQueryParams): Observable<ApiResponse<TaskResponse>> {
    let params = new HttpParams();
    
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        const value = (queryParams as any)[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<TaskResponse>>(`${this.baseUrl}/tasks`, { params });
  }

  /**
   * Gets a specific task by ID
   */
  getTask(taskId: string): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.baseUrl}/tasks/${taskId}`);
  }

  /**
   * Gets tasks for a specific process instance
   */
  getTasksForProcessInstance(processInstanceId: string): Observable<ApiResponse<TaskResponse>> {
    const queryParams: TaskQueryParams = {
      processInstanceId: processInstanceId
    };
    return this.getTasks(queryParams);
  }

  /**
   * Gets form data for a task
   */
  getTaskFormData(taskId: string): Observable<{ [key: string]: TaskVariable }> {
    return this.http.get<{ [key: string]: TaskVariable }>(`${this.baseUrl}/tasks/${taskId}/form-data`);
  }

  /**
   * Submits form data to complete a task
   */
  completeTask(taskId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/tasks/${taskId}/complete`, formData);
  }

  /**
   * Submits form data without completing the task (save draft)
   */
  saveTaskFormData(taskId: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}/tasks/${taskId}/form-data`, formData);
  }

  /**
   * Claims a task for the current user
   */
  claimTask(taskId: string, assignee: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/tasks/${taskId}/claim`, { assignee });
  }

  /**
   * Unclaims a task
   */
  unclaimTask(taskId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/tasks/${taskId}/unclaim`, {});
  }

  /**
   * Gets the form key for a task
   */
  getTaskFormKey(taskId: string): Observable<{ formKey?: string; formRef?: string }> {
    return this.http.get<{ formKey?: string; formRef?: string }>(`${this.baseUrl}/tasks/${taskId}/form-key`);
  }

  /**
   * Gets form definition by form key
   */
  getFormByKey(formKey: string): Observable<FormDefinition> {
    return this.http.get<FormDefinition>(`${this.baseUrl}/flowable-forms/${formKey}`);
  }

  /**
   * Gets form schema by form key
   */
  getFormSchema(formKey: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/flowable-forms/${formKey}/schema`);
  }

  /**
   * Gets form properties by form key
   */
  getFormProperties(formKey: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/flowable-forms/${formKey}/properties`);
  }

  /**
   * Gets list of all forms
   */
  getAllForms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/flowable-forms/list`);
  }

  /**
   * Renders a form for a specific task
   */
  renderTaskForm(taskId: string): Observable<{ formHtml: string; formData: any }> {
    return this.http.get<{ formHtml: string; formData: any }>(`${this.baseUrl}/tasks/${taskId}/form`);
  }

  /**
   * Gets task variables
   */
  getTaskVariables(taskId: string): Observable<{ [key: string]: TaskVariable }> {
    return this.http.get<{ [key: string]: TaskVariable }>(`${this.baseUrl}/tasks/${taskId}/variables`);
  }

  /**
   * Sets task variables
   */
  setTaskVariables(taskId: string, variables: { [key: string]: TaskVariable }): Observable<any> {
    return this.http.put(`${this.baseUrl}/tasks/${taskId}/variables`, variables);
  }

  /**
   * Gets task history
   */
  getTaskHistory(taskId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/history/tasks/${taskId}`);
  }
}