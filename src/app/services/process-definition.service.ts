import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProcessDefinition } from '../models/process-definition.model';

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
}