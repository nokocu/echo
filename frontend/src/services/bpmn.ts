import api from './api';

export interface BpmnWorkflow {
  id: number;
  name: string;
  description: string;
  projectId?: number | null;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BpmnWorkflowDetail extends BpmnWorkflow {
  bpmnXml: string;
  bpmnJson: string;
  elements: BpmnElement[];
  connections: BpmnConnection[];
}

export interface BpmnElement {
  id: number;
  elementId: string;
  elementType: string;
  name: string;
  properties: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BpmnConnection {
  id: number;
  connectionId: string;
  sourceElementId: string;
  targetElementId: string;
  name: string;
  condition: string;
  waypoints: string;
}

export interface CreateBpmnWorkflowRequest {
  name: string;
  description: string;
  projectId?: number | null;
  bpmnXml?: string;
  bpmnJson?: string;
}

export interface SaveBpmnWorkflowRequest {
  name: string;
  description: string;
  bpmnXml: string;
  bpmnJson: string;
  elements: BpmnElement[];
  connections: BpmnConnection[];
}

export const bpmnService = {
  // get all workflows for a user (including unassigned ones)
  async getAllWorkflows(): Promise<BpmnWorkflow[]> {
    const response = await api.get('/bpmn/workflows/all');
    return response.data;
  },

  // get all workflows for a project
  async getWorkflows(projectId: number): Promise<BpmnWorkflow[]> {
    const response = await api.get(`/bpmn/workflows/${projectId}`);
    return response.data;
  },

  // get detailed workflow with XML and elements
  async getWorkflow(workflowId: number): Promise<BpmnWorkflowDetail> {
    const response = await api.get(`/bpmn/workflow/${workflowId}`);
    return response.data;
  },

  // create new workflow
  async createWorkflow(request: CreateBpmnWorkflowRequest): Promise<BpmnWorkflow> {
    const response = await api.post('/bpmn/workflow', request);
    return response.data;
  },

  // save workflow (update with new diagram)
  async saveWorkflow(workflowId: number, request: SaveBpmnWorkflowRequest): Promise<BpmnWorkflowDetail> {
    const response = await api.put(`/bpmn/workflow/${workflowId}`, request);
    return response.data;
  },

  // delete workflow
  async deleteWorkflow(workflowId: number): Promise<void> {
    await api.delete(`/bpmn/workflow/${workflowId}`);
  },

  // activate workflow (makes it the active workflow for the project)
  async activateWorkflow(workflowId: number): Promise<void> {
    await api.post(`/bpmn/workflow/${workflowId}/activate`);
  },

  // assign workflow to project (with swapping logic)
  async assignWorkflowToProject(workflowId: number, projectId: number): Promise<void> {
    await api.post(`/bpmn/workflow/${workflowId}/assign/${projectId}`);
  },

  // copy workflow to project (creates a new workflow in the target project)
  async copyWorkflowToProject(workflowId: number, projectId: number): Promise<BpmnWorkflow> {
    const response = await api.post(`/bpmn/workflow/${workflowId}/copy/${projectId}`);
    return response.data;
  },

  // duplicate workflow (creates an unassigned copy)
  async duplicateWorkflow(workflowId: number): Promise<BpmnWorkflow> {
    const response = await api.post(`/bpmn/workflow/${workflowId}/duplicate`);
    return response.data;
  },
};
