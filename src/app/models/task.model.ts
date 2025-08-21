export interface Task {
  id: string;
  name: string;
  description: string | null;
  assignee: string | null;
  owner: string | null;
  createTime: number[]; // Array format: [year, month, day, hour, minute, second, nanosecond]
  dueDate: number[] | null;
  priority: number;
  processInstanceId: string;
  processDefinitionId: string;
  executionId: string;
  taskDefinitionKey: string;
  category: string | null;
  formKey: string | null;
  tenantId: string;
}