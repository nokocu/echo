import { useState, useEffect } from 'react';
import { tasksService } from '../../services/tasks';
import { bpmnService } from '../../services/bpmn';
import type { Project } from '../../types/api';
import CreateProjectModal from './CreateP';
import EditProjectModal from './EditP';
import DeleteProjectModal from './DeleteP';
import BpmnWorkflowDesigner from '../workflow/Designer';

interface ProjectsManagerProps {
  onViewTasks?: (projectId: number) => void;
}

export default function ProjectsManager({ onViewTasks }: ProjectsManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isWorkflowDesignerOpen, setIsWorkflowDesignerOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tasksService.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreated = () => {
    fetchProjects(); // refresh the projects list
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteModalOpen(true);
  };

  const handleConfigureWorkflow = async (projectId: number) => {
    try {
      // get workflows for this project
      const workflows = await bpmnService.getWorkflows(projectId);
      
      if (workflows.length > 0) {
        // use the first workflow for this project
        setSelectedWorkflowId(workflows[0].id);
      } else {
        // create a new workflow for this project
        const project = projects.find(p => p.id === projectId);
        const workflowName = project ? `${project.name} Workflow` : `Project ${projectId} Workflow`;
        
        const newWorkflow = await bpmnService.createWorkflow({
          name: workflowName,
          description: `Workflow for project: ${project?.name || projectId}`,
          projectId: projectId,
          bpmnXml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Camunda Modeler" exporterVersion="5.0.0">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="79" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
        });
        
        setSelectedWorkflowId(newWorkflow.id);
      }
      
      setSelectedProjectId(projectId);
      setIsWorkflowDesignerOpen(true);
    } catch (error) {
      console.error('Failed to configure workflow:', error);
      setError('Failed to configure workflow');
    }
  };

  const handleProjectUpdated = () => {
    fetchProjects();
    setSelectedProject(null);
  };

  const handleProjectDeleted = () => {
    fetchProjects();
    setSelectedProject(null);
  };

  // show BpmnWorkflowDesigner if it's open
  if (isWorkflowDesignerOpen && selectedWorkflowId && selectedProjectId) {
    return (
      <BpmnWorkflowDesigner
        workflowId={selectedWorkflowId}
        projectId={selectedProjectId}
        onClose={() => {
          setIsWorkflowDesignerOpen(false);
          setSelectedWorkflowId(null);
          setSelectedProjectId(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading projects...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Project Management</h2>
            <p className="text-gray-400">Manage your projects and configure BPMN workflows</p>
          </div>
          <button
            onClick={handleCreateProject}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>+</span>
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl text-gray-400 mb-2">No Projects Found</h3>
          <p className="text-gray-500 mb-4">Create your first project to get started</p>
          <button
            onClick={handleCreateProject}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onViewTasks={onViewTasks}
              onConfigureWorkflow={handleConfigureWorkflow}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProjectUpdated={handleProjectUpdated}
        project={selectedProject}
      />

      <DeleteProjectModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onProjectDeleted={handleProjectDeleted}
        project={selectedProject}
      />
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onViewTasks?: (projectId: number) => void;
  onConfigureWorkflow?: (projectId: number) => void;
}

function ProjectCard({ project, onEdit, onDelete, onViewTasks, onConfigureWorkflow }: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:bg-gray-750 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{project.name}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onDelete(project)}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Delete project"
          >
            🗑️
          </button>
        </div>
      </div>

      {project.description && (
        <p className="text-gray-300 mb-4 text-sm line-clamp-3">
          {project.description}
        </p>
      )}

      <div className="space-y-2 text-sm text-gray-400">
        <div className="flex items-center justify-between">
          <span>Owner:</span>
          <span className="text-gray-300">{project.ownerName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Created:</span>
          <span className="text-gray-300">{formatDate(project.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Updated:</span>
          <span className="text-gray-300">{formatDate(project.updatedAt)}</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <button 
            onClick={() => onConfigureWorkflow?.(project.id)}
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
          >
            <span>Workflow</span>
          </button>
            <button 
              onClick={() => onViewTasks?.(project.id)}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Tasks
            </button>
            <button 
              onClick={() => onEdit(project)}
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
