import { useState, useEffect } from 'react';
import { tasksService } from '../../services/tasks';
import { workflowService } from '../../services/workflow';
import type { TaskItem } from '../../types/api';
import type { WorkflowState } from '../../services/workflow';
import CreateTaskModal from './CreateT';
import TaskStatusBadge from './TaskBadge';
import TaskAuditHistory from './TaskHistory';
import ProjectSelector from './Selector';

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
      case '#gray': return '#4b5563'; // gray-600
      case '#blue': return '#2563eb'; // blue-600
      case '#yellow': return '#ca8a04'; // yellow-600
      case '#green': return '#16a34a'; // green-600
      case '#red': return '#dc2626'; // red-600
      default: return '#4b5563'; // gray-600
    }
  };

  const getStatePatternStyle = (color?: string) => {
    const colorValue = getStateColor(color);
    return {
      backgroundImage: `repeating-linear-gradient(315deg, ${colorValue}33 0, ${colorValue}33 1px, transparent 0, transparent 50%)`,
      backgroundSize: '10px 10px',
      backgroundAttachment: 'fixed'
    } as React.CSSProperties;
  };

  return (
    <div className="isolate mx-auto grid w-full max-w-2xl grid-cols-1 gap-10 pt-10 md:pb-24 xl:max-w-7xl">
      <div className="px-4 sm:px-6">
        <div>
          <p data-section="true" className="font-mono text-xs/6 font-medium tracking-widest text-gray-600 uppercase dark:text-gray-400">
            Organize and track workflow progress
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">
            Kanban Board
          </h1>
        </div>

        {/* Project Selector */}
        <div className="mt-8">
          <ProjectSelector
            selectedProjectId={selectedProject}
            onProjectChange={handleProjectChange}
            onCreateProject={() => {}}
          />
        </div>

        {!selectedProject ? (
          <div className="mt-12 text-center py-12 border border-gray-700 rounded">
            <h3 className="text-xl text-gray-400 mb-2">Select a Project</h3>
            <p className="text-gray-500">Choose a project to view its tasks in the Kanban board</p>
          </div>
        ) : (
          <>
            {/* Actions Bar */}
            <div className="mt-8 flex items-center justify-between p-4 border border-gray-700 rounded">
              <div>
                <p className="text-gray-400 text-sm">Manage tasks across workflow states • Click status badges to change states</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <span>+</span>
                <span>Create Task</span>
              </button>
            </div>

            {loading && (
              <div className="mt-8 flex items-center justify-center py-12 border border-gray-700 rounded bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-400">Loading tasks...</span>
              </div>
            )}

            {error && (
              <div className="mt-8 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {workflowStates.map((state) => {
                  const columnTasks = getTasksByStateId(state.id);
                  
                  return (
                    <div key={state.id} className="border border-gray-700 rounded">
                      <div 
                        className="p-4 border-b border-gray-700 rounded-t"
                        style={getStatePatternStyle(state.color)}
                      >
                        <h3 className="text-white font-semibold flex items-center justify-between px-3 py-2 rounded">
                          {state.name}
                          <span className="text-xs px-2 py-1 rounded-full">
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
      </div>

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
      className={`bg-gray-900 rounded p-4 border-l-4 hover:bg-gray-650 transition-colors ${
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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-1 inline">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          History
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
            {task.projectName}
          </span>
        </div>
        
        {task.dueDate && (
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z" />
            </svg>
            {new Date(task.dueDate).toLocaleDateString('pl-PL')}
          </span>
        )}
      </div>

      {task.assigneeName && (
        <div className="mt-2 text-xs text-gray-400 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          {task.assigneeName}
        </div>
      )}
    </div>
  );
}
