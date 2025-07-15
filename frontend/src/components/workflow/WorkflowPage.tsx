import { useState, useEffect } from 'react';
import { bpmnService } from '../../services/bpmn';
import { tasksService } from '../../services/tasks';
import type { BpmnWorkflow, CreateBpmnWorkflowRequest } from '../../services/bpmn';
import type { Project } from '../../types/api';
import BpmnWorkflowDesigner from './Designer';

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
      <div className="isolate mx-auto grid w-full max-w-2xl grid-cols-1 gap-10 pt-10 md:pb-24 xl:max-w-7xl">
        <div className="px-4 sm:px-6">
          <div className="mt-8 flex items-center justify-center py-12 border border-gray-700 rounded bg-gray-900">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading workflows...</span>
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
            Design and manage business processes
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">
            All Workflows
          </h1>
        </div>

        {/* Actions Bar */}
        <div className="mt-8 flex items-center justify-between p-4 border border-gray-700 rounded">
          <div>
            <p className="text-gray-400 text-sm">Manage workflows across all projects • Create BPMN processes and assign to teams</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-gray-800 text-white rounded transition-colors flex items-center space-x-2"
          >
            <span>+</span>
            <span>Create Workflow</span>
          </button>
        </div>

        {error && (
          <div className="mt-8 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {workflows.length === 0 ? (
          <div className="mt-12 text-center py-12 border border-gray-700 rounded bg-gray-900">
            <h3 className="text-xl text-gray-400 mb-2">No workflows found</h3>
            <p className="text-gray-500 mb-4">Create your first workflow to get started</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded transition-colors"
            >
              Create Your First Workflow
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="bg-gray-900 rounded border border-gray-700 p-6 transition-colors flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{workflow.name}</h3>
                    <p className="text-gray-400 text-sm mb-2">{workflow.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                        </svg>
                        <span>{workflow.project?.name || 'Unassigned'}</span>
                      </div>
                      {!workflow.project && (
                        <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    {workflow.isActive && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                        Active
                      </span>
                    )}
                    <button
                      onClick={() => duplicateWorkflow(workflow.id)}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                      title="Duplicate workflow"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteWorkflow(workflow.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete workflow"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span>Version {workflow.version}</span>
                  <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Spacer to push buttons to bottom */}
                <div className="flex-grow"></div>

                <div className="space-y-2">
                  <div className="relative">
                    <button
                      onClick={() => setSelectedWorkflowId(workflow.id)}
                      className="w-full px-3 py-2 text-white rounded text-sm transition-colors"
                      style={{ backgroundColor: '#2563eb80' }}
                    >
                      Configure Workflow
                    </button>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => toggleProjectSelection(workflow.id)}
                      className="w-full px-3 py-2 text-white rounded text-sm transition-colors"
                      style={{ backgroundColor: '#16a34a80' }}
                    >
                      Use in Project
                    </button>
                    
                    {showProjectSelection[workflow.id] && (
                      <div className="absolute bottom-full mb-2 right-0 w-56 bg-gray-700 border border-gray-600 rounded shadow-lg z-10">
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
                                className="w-full text-left px-2 py-1 text-sm text-gray-300 rounded mb-1"
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
      </div>

      {/* Create Workflow Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded p-6 w-full max-w-md">
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 bg-gray-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createWorkflow}
                disabled={creating || !newWorkflowName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-gray-800 rounded p-6 w-full max-w-md">
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
                className="px-4 py-2 bg-gray-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmWorkflowSwap}
                className="px-4 py-2 bg-orange-600 text-white rounded transition-colors"
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
