// API Models for Flowable/Camunda Integration

export interface TaskResponse {
  id: string;
  name: string;
  description?: string;
  assignee?: string;
  owner?: string;
  processInstanceId: string;
  processDefinitionId: string;
  taskDefinitionKey: string;
  formKey?: string;
  created: string;
  due?: string;
  suspended: boolean;
  variables?: { [key: string]: TaskVariable };
}

export interface TaskVariable {
  value: any;
  type: string;
  valueInfo?: { [key: string]: any };
}

export interface FormData {
  taskId?: string;
  processInstanceId?: string;
  variables: { [key: string]: TaskVariable };
}

export interface FormDefinition {
  id: string;
  key: string;
  name: string;
  version: number;
  resource: string;
  deploymentId: string;
  tenantId?: string;
}

export interface ProcessInstanceResponse {
  id: string;
  processDefinitionId: string;
  processDefinitionKey: string;
  processDefinitionName: string;
  businessKey?: string;
  started: string;
  ended?: string;
  suspended: boolean;
  variables?: { [key: string]: TaskVariable };
}

export interface DeploymentResponse {
  id: string;
  name: string;
  deploymentTime: string;
  category?: string;
  tenantId?: string;
  resources: DeploymentResource[];
}

export interface DeploymentResource {
  id: string;
  name: string;
  type: string;
  deploymentId: string;
}

export interface TaskQueryParams {
  assignee?: string;
  processInstanceId?: string;
  processDefinitionKey?: string;
  taskDefinitionKey?: string;
  name?: string;
  nameLike?: string;
  suspended?: boolean;
  active?: boolean;
  size?: number;
  start?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T[];
  total: number;
  start: number;
  size: number;
}

export interface ErrorResponse {
  message: string;
  exception?: string;
  status: number;
  timestamp: string;
  path: string;
}