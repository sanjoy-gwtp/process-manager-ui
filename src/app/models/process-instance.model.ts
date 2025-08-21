export interface ProcessInstance {
  id: string;
  processDefinitionId: string;
  processDefinitionKey: string;
  processDefinitionName: string;
  processDefinitionVersion: string;
  deploymentId: string;
  businessKey: string | null;
  activityId: string | null;
  startTime: number[]; // Array format: [year, month, day, hour, minute, second, nanosecond]
  startUserId: string | null;
  superExecutionId: string | null;
  rootProcessInstanceId: string;
  tenantId: string;
  description: string | null;
  localizedName: string | null;
  localizedDescription: string | null;
  suspended: boolean;
  ended: boolean;
}