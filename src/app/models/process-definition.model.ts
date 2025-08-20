export interface ProcessDefinition {
  id: string;
  key: string;
  name: string;
  description: string | null;
  version: number;
  category: string;
  deploymentId: string;
  resourceName: string;
  deploymentTime: string | null;
  tenantId: string;
  diagramResourceName: string;
  hasStartFormKey: boolean;
  hasGraphicalNotation: boolean;
  suspended: boolean;
}