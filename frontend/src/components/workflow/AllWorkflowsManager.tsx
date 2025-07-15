import { useState, useEffect } from 'react';
import { bpmnService } from '../../services/bpmn';
import { tasksService } from '../../services/tasks';
import type { BpmnWorkflow, CreateBpmnWorkflowRequest } from '../../services/bpmn';
import type { Project } from '../../types/api';
import BpmnWorkflowDesigner from './BpmnWorkflowDesigner';

interface WorkflowWithProject extends BpmnWorkflow {
  project?: Project;
}

export default function AllWorkflowsManager() {
  const [workflows, setWorkflows] = useState<WorkflowWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [showProjectSelection, setShowProjectSelection] = useState<{ [key: number]: boolean }>({});
  const [confirmSwap, setConfirmSwap] = useState<{ workflowId: number; projectId: number; projectName: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // fetch all projects first
      const projectsData = await tasksService.getProjects();
      setProjects(projectsData);
      
      // fetch all workflows (including unassigned ones) using the new API
      const allWorkflowsData = await bpmnService.getAllWorkflows();
      
      // map workflows to include project information
      const workflowsWithProject: WorkflowWithProject[] = allWorkflowsData.map(workflow => {
        const project = projectsData.find(p => p.id === workflow.projectId);
        return {
          ...workflow,
          project
        };
      });
      
      setWorkflows(workflowsWithProject);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async () => {
    if (!newWorkflowName.trim()) return;

    try {
      setCreating(true);
      setError(null);

      const createRequest: CreateBpmnWorkflowRequest = {
        name: newWorkflowName,
        description: newWorkflowDescription,
        projectId: null // always create unassigned workflows
      };

      await bpmnService.createWorkflow(createRequest);
      
      // reset form
      setNewWorkflowName('');
      setNewWorkflowDescription('');
      setIsCreateModalOpen(false);
      
      // refresh workflows
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create workflow');
    } finally {
      setCreating(false);
    }
  };

  const toggleProjectSelection = (workflowId: number) => {
    setShowProjectSelection(prev => ({
      ...prev,
      [workflowId]: !prev[workflowId]
    }));
  };

  const assignWorkflowToProject = async (workflowId: number, projectId?: number) => {
    try {
      if (projectId) {
        // use the assignment API
        await bpmnService.assignWorkflowToProject(workflowId, projectId);
      } else {
        // just activate the workflow for workflows already assigned to projects
        await bpmnService.activateWorkflow(workflowId);
      }
      
      setShowProjectSelection(prev => ({
        ...prev,
        [workflowId]: false
      }));
      
      // refresh workflows to get updated state
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to assign workflow');
    }
  };

  const duplicateWorkflow = async (workflowId: number) => {
    try {
      await bpmnService.duplicateWorkflow(workflowId);
      
      // refresh workflows
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate workflow');
    }
  };

  const deleteWorkflow = async (workflowId: number) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the workflow "${workflow.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await bpmnService.deleteWorkflow(workflowId);
      
      // refresh workflows
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete workflow');
    }
  };

  const handleAssignWorkflow = async (workflowId: number, projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const hasActiveWorkflow = workflows.some(w => 
      w.projectId === projectId && w.isActive && w.id !== workflowId
    );

    if (hasActiveWorkflow) {
      // show confirmation for replace
      setConfirmSwap({ workflowId, projectId, projectName: project.name });
    } else {
      // direct assignment
      await assignWorkflowToProject(workflowId, projectId);
    }
  };

  const confirmWorkflowSwap = async () => {
    if (!confirmSwap) return;
    
    await assignWorkflowToProject(confirmSwap.workflowId, confirmSwap.projectId);
    setConfirmSwap(null);
  };

  if (selectedWorkflowId) {
    const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);
    return (
      <BpmnWorkflowDesigner
        workflowId={selectedWorkflowId}
        projectId={selectedWorkflow?.project?.id || 0}
        onSave={() => fetchData()}
        onClose={() => setSelectedWorkflowId(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">Loading workflows...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">All Workflows</h1>
          <p className="text-gray-400 mt-1">Manage workflows across all projects</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Workflow
        </button>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-4">No workflows found</div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Your First Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{workflow.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{workflow.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">📁</span>
                      <span>{workflow.project?.name || 'Unassigned'}</span>
                    </div>
                    {!workflow.project && (
                      <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
                {workflow.isActive && (
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <span>Version {workflow.version}</span>
                <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedWorkflowId(workflow.id)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Configure
                </button>
                
                <button
                  onClick={() => duplicateWorkflow(workflow.id)}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                  title="Duplicate workflow"
                >
                  📋
                </button>
                
                <button
                  onClick={() => deleteWorkflow(workflow.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                  title="Delete workflow"
                >
                  🗑️
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => toggleProjectSelection(workflow.id)}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    Use in Project
                  </button>
                  
                  {showProjectSelection[workflow.id] && (
                    <div className="absolute right-0 mt-2 w-56 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
                      <div className="p-2">
                        <div className="text-sm text-gray-300 mb-2">Select project:</div>
                        {projects.map((project) => {
                          const hasActiveWorkflow = workflows.some(w => 
                            w.projectId === project.id && w.isActive && w.id !== workflow.id
                          );
                          return (
                            <button
                              key={project.id}
                              onClick={() => handleAssignWorkflow(workflow.id, project.id)}
                              className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-600 rounded mb-1"
                            >
                              <div className="flex items-center justify-between">
                                <span>{project.name}</span>
                                <span className="text-xs text-gray-400">
                                  {hasActiveWorkflow ? 'Replace' : 'Assign'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Workflow Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create New Workflow</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newWorkflowDescription}
                  onChange={(e) => setNewWorkflowDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow description"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewWorkflowName('');
                  setNewWorkflowDescription('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createWorkflow}
                disabled={creating || !newWorkflowName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Replace Modal */}
      {confirmSwap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Confirm Workflow Assignment</h2>
            
            <div className="text-gray-300 mb-6">
              <p className="mb-2">
                Project "<strong>{confirmSwap.projectName}</strong>" already has an active workflow.
              </p>
              <p className="text-sm text-orange-400">
                ⚠ This will replace the current active workflow and make it unassigned.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmSwap(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmWorkflowSwap}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                Replace Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
