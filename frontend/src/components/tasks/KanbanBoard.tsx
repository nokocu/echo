import { useState, useEffect } from 'react';
import { tasksService } from '../../services/tasks';
import { workflowService } from '../../services/workflow';
import type { TaskItem } from '../../types/api';
import type { WorkflowState } from '../../services/workflow';
import CreateTaskModal from './CreateTaskModal';
import TaskStatusBadge from './TaskStatusBadge';
import TaskAuditHistory from './TaskAuditHistory';
import ProjectSelector from '../layout/ProjectSelector';

interface KanbanBoardProps {
  initialProjectId?: number | null;
}

export default function KanbanBoard({ initialProjectId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(initialProjectId || null);

  // update selected project when initialProjectId changes
  useEffect(() => {
    if (initialProjectId) {
      setSelectedProject(initialProjectId);
    }
  }, [initialProjectId]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [auditTaskId, setAuditTaskId] = useState<number | null>(null);

  const fetchData = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // fetch tasks and workflow states for the selected project
      const [tasksData, statesData] = await Promise.all([
        tasksService.getTasks(),
        workflowService.getWorkflowStates(selectedProject)
      ]);
      
      // filter tasks for the selected project
      const projectTasks = tasksData.filter(task => task.projectId === selectedProject);
      setTasks(projectTasks);
      setWorkflowStates(statesData.sort((a, b) => a.order - b.order));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProject]);

  const handleProjectChange = (projectId: number) => {
    setSelectedProject(projectId);
  };

  const handleTaskCreated = () => {
    fetchData();
  };

  const handleStatusChange = async (taskId: number, newStateId: number) => {
    try {
      await workflowService.transitionTask(taskId, { 
        ToStateId: newStateId,
        Comment: `changed via kanban board`
      });
      
      // refresh
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to change task status');
    }
  };

  const getTasksByStateId = (stateId: number) => {
    return tasks.filter(task => task.workflowStateId === stateId);
  };

  const getStateColor = (color?: string) => {
    switch (color) {
      case '#gray': return 'bg-gray-600';
      case '#blue': return 'bg-blue-600';
      case '#yellow': return 'bg-yellow-600';
      case '#green': return 'bg-green-600';
      case '#red': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="p-6">
      {/* Project Selector for filtering tasks */}
      <div className="mb-6">
        <ProjectSelector
          selectedProjectId={selectedProject}
          onProjectChange={handleProjectChange}
          onCreateProject={() => {}}
        />
      </div>

      {!selectedProject ? (
        <div className="text-center py-12">
          <h3 className="text-xl text-gray-400 mb-2">Select a Project</h3>
          <p className="text-gray-500">Choose a project to view its tasks in the Kanban board</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Kanban Board</h2>
                <p className="text-gray-400">Manage tasks across workflow states • Click status badges to change states</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>+</span>
                <span>Create Task</span>
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Loading tasks...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {workflowStates.map((state) => {
                const columnTasks = getTasksByStateId(state.id);
                
                return (
                  <div key={state.id} className="bg-gray-800 rounded-lg border border-gray-700">
                    <div className={`p-4 ${getStateColor(state.color)} rounded-t-lg`}>
                      <h3 className="text-white font-semibold flex items-center justify-between">
                        {state.name}
                        <span className="bg-gray-900 text-xs px-2 py-1 rounded-full">
                          {columnTasks.length}
                        </span>
                      </h3>
                    </div>

                    <div className="p-4 space-y-3 min-h-[400px]">
                      {columnTasks.length === 0 ? (
                        <div className="text-gray-400 text-sm text-center py-8">
                          No tasks in {state.name.toLowerCase()}
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            workflowStates={workflowStates}
                            onStatusChange={handleStatusChange}
                            onShowHistory={(taskId) => setAuditTaskId(taskId)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />

      {auditTaskId && (
        <TaskAuditHistory
          taskId={auditTaskId}
          isOpen={!!auditTaskId}
          onClose={() => setAuditTaskId(null)}
        />
      )}
    </div>
  );
}

// taskcard
interface TaskCardProps {
  task: TaskItem;
  workflowStates: WorkflowState[];
  onStatusChange: (taskId: number, newStateId: number) => void;
  onShowHistory: (taskId: number) => void;
}

function TaskCard({ task, workflowStates, onStatusChange, onShowHistory }: TaskCardProps) {
  const currentState = workflowStates.find(s => s.id === task.workflowStateId);
  if (!currentState) return null;

  const priorityColors = {
    'Low': 'border-l-green-400',
    'Medium': 'border-l-yellow-400', 
    'High': 'border-l-red-400',
    'Critical': 'border-l-red-600',
  };

  return (
    <div
      className={`bg-gray-700 rounded-lg p-4 border-l-4 hover:bg-gray-650 transition-colors ${
        priorityColors[task.priority as keyof typeof priorityColors] || 'border-l-gray-400'
      }`}
    >
      <h4 className="text-white font-medium mb-2 text-sm">
        {task.title}
      </h4>
      
      {task.description && (
        <p className="text-gray-300 text-xs mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mb-3">
        <TaskStatusBadge
          currentState={currentState}
          projectId={task.projectId}
          onStateChange={(newStateId) => onStatusChange(task.id, newStateId)}
        />
        
        <button
          onClick={() => onShowHistory(task.id)}
          className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
          title="View history"
        >
          📋 History
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <span className="flex items-center">
            📂 {task.projectName}
          </span>
        </div>
        
        {task.dueDate && (
          <span className="flex items-center">
            📅 {new Date(task.dueDate).toLocaleDateString('pl-PL')}
          </span>
        )}
      </div>

      {task.assigneeName && (
        <div className="mt-2 text-xs text-gray-400">
          👤 {task.assigneeName}
        </div>
      )}
    </div>
  );
}
