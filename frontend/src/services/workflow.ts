import api from './api';

export interface WorkflowState {
  id: number;
  name: string;
  type: string;
  order: number;
  color?: string;
  description?: string;
}

export interface WorkflowTransition {
  id: number;
  name: string;
  fromStateId: number;
  fromStateName: string;
  toStateId: number;
  toStateName: string;
  conditions?: string;
  isAutomatic: boolean;
  order: number;
}

export interface WorkflowAuditEntry {
  id: number;
  fromStateName: string;
  toStateName: string;
  userName: string;
  comment?: string;
  transitionedAt: string;
  systemInfo?: string;
}

export interface TransitionRequest {
  ToStateId: number;
  Comment?: string;
}

export const workflowService = {
  // get workflow states for project
  async getWorkflowStates(projectId: number): Promise<WorkflowState[]> {
    const response = await api.get(`/workflow/states/${projectId}`);
    return response.data;
  },

  // get possible transitions for project
  async getWorkflowTransitions(projectId: number): Promise<WorkflowTransition[]> {
    const response = await api.get(`/workflow/transitions/${projectId}`);
    return response.data;
  },

  // transition task to new state
  async transitionTask(taskId: number, request: TransitionRequest): Promise<any> {
    const response = await api.post(`/workflow/transition/${taskId}`, request);
    return response.data;
  },

  // get task audit history
  async getTaskAuditHistory(taskId: number): Promise<WorkflowAuditEntry[]> {
    const response = await api.get(`/workflow/audit/${taskId}`);
    return response.data;
  },

  // process automatic transitions
  async processAutomaticTransitions(projectId: number): Promise<any> {
    const response = await api.post(`/workflow/process-automatic/${projectId}`);
    return response.data;
  },
};
