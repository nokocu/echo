export interface TaskItem {
  id: number;
  title: string;
  description: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  projectId: number;
  projectName: string;
  assigneeId?: string;
  assigneeName?: string;
  workflowStateId: number;
  workflowStateName: string;
  workflowStateColor: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
}

export interface User {
  id: string;
  userName: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
