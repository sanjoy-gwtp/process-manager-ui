import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProcessDefinition } from '../models/process-definition.model';
import { ProcessInstance } from '../models/process-instance.model';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class ProcessDefinitionService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  getProcessDefinitions(): Observable<ProcessDefinition[]> {
    return this.http.get<ProcessDefinition[]>(`${this.baseUrl}/process-definitions`);
  }

  getProcessDefinitionById(id: string): Observable<ProcessDefinition> {
    return this.http.get<ProcessDefinition>(`${this.baseUrl}/process-definitions/${id}`);
  }

  getProcessDefinitionXml(id: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/process-definitions/${encodeURIComponent(id)}/xml`, {
      responseType: 'text'
    });
  }

  deployProcessDefinition(xmlContent: string, processName: string): Observable<any> {
    const formData = new FormData();
    
    // Create a Blob from the XML content
    const xmlBlob = new Blob([xmlContent], { type: 'text/xml' });
    
    // Add the file to form data with the expected filename format
    formData.append('file', xmlBlob, `${processName}.bpmn20.xml`);
    
    return this.http.post(`${this.baseUrl}/process-definitions/deploy?name=${encodeURIComponent(processName)}`, formData);
  }

  suspendProcessDefinition(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/process-definitions/${encodeURIComponent(id)}/suspend`, {});
  }

  activateProcessDefinition(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/process-definitions/${encodeURIComponent(id)}/activate`, {});
  }

  deleteProcessDefinition(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/process-definitions/${encodeURIComponent(id)}`);
  }

  getProcessInstances(): Observable<ProcessInstance[]> {
    return this.http.get<ProcessInstance[]>(`${this.baseUrl}/process/instances`);
  }

  getProcessInstanceDiagram(instanceId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/diagram/process-instance/${encodeURIComponent(instanceId)}`, {
      responseType: 'blob'
    });
  }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/process/tasks`);
  }
}