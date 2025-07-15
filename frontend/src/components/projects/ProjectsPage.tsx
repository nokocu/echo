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
      <div className="isolate mx-auto grid w-full max-w-2xl grid-cols-1 gap-10 pt-10 md:pb-24 xl:max-w-7xl">
        <div className="px-4 sm:px-6">
          <div className="mt-8 flex items-center justify-center py-12 border border-gray-700 rounded bg-gray-900">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading projects...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="isolate mx-auto grid w-full max-w-2xl grid-cols-1 gap-10 pt-10 md:pb-24 xl:max-w-7xl">
        <div className="px-4 sm:px-6">
          <div className="mt-8 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="isolate mx-auto grid w-full max-w-2xl grid-cols-1 gap-10 pt-10 md:pb-24 xl:max-w-7xl">
      <div className="px-4 sm:px-6">
        <div>
          <p data-section="true" className="font-mono text-xs/6 font-medium tracking-widest text-gray-600 uppercase dark:text-gray-400">
            Manage projects and workflows
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">
            Project Management
          </h1>
        </div>

        {/* Actions Bar */}
        <div className="mt-8 flex items-center justify-between p-4 border border-gray-700 rounded">
          <div>
            <p className="text-gray-400 text-sm">Organize projects and configure BPMN workflows • Manage tasks and edit project details</p>
          </div>
          <button
            onClick={handleCreateProject}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <span>+</span>
            <span>Create Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="mt-12 text-center py-12 border border-gray-700 rounded bg-gray-900">
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
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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
      </div>

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
    <div className="bg-gray-900 rounded border border-gray-700 p-6 hover:bg-gray-800 transition-colors flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{project.name}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onDelete(project)}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Delete project"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {project.description && (
        <p className="text-gray-300 mb-4 text-sm line-clamp-3">
          {project.description}
        </p>
      )}

      <div className="space-y-2 text-sm text-gray-400 mb-6">
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

      {/* Spacer to push buttons to bottom */}
      <div className="flex-grow"></div>

      <div className="pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => onConfigureWorkflow?.(project.id)}
            className="px-3 py-2 text-white rounded-md transition-colors text-sm"
            style={{ backgroundColor: '#a855f780' }}
          >
            Workflow
          </button>
          <button 
            onClick={() => onViewTasks?.(project.id)}
            className="px-3 py-2 text-white rounded-md transition-colors text-sm"
            style={{ backgroundColor: '#2563eb80' }}
          >
            Tasks
          </button>
          <button 
            onClick={() => onEdit(project)}
            className="px-3 py-2 text-white rounded-md transition-colors text-sm"
            style={{ backgroundColor: '#6b728080' }}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
