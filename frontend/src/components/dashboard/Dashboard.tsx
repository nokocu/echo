import { useEffect, useState } from 'react';
import { tasksService } from '../../services/tasks';
import type { TaskItem, Project } from '../../types/api';
import CreateTaskModal from '../tasks/CreateTaskModal';

const statusColors = {
  'TODO': 'bg-gray-600',
  'IN_PROGRESS': 'bg-blue-600',
  'COMPLETED': 'bg-green-600',
  'BLOCKED': 'bg-red-600',
};

const priorityColors = {
  'Low': 'text-green-400',
  'Medium': 'text-yellow-400',
  'High': 'text-red-400',
  'Critical': 'text-red-600',
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const tasksData = await tasksService.getTasks();
      setTasks(tasksData);
      
      // try to get projects, dont fail if endpoint doesnt exist yet
      try {
        const projectsData = await tasksService.getProjects();
        setProjects(projectsData);
      } catch (projectError) {
        console.log('Projects endpoint not available yet');
        setProjects([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTaskCreated = () => {
    fetchData(); // refresh the tasks list
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  const todoTasks = tasks.filter(task => task.workflowStateName === 'TODO');
  const inProgressTasks = tasks.filter(task => task.workflowStateName === 'IN_PROGRESS');
  const completedTasks = tasks.filter(task => task.workflowStateName === 'COMPLETED');
  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">overview</h2>
            <p className="text-gray-400">manage tasks and track progress</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">total tasks</h3>
          <p className="text-3xl font-bold text-blue-400">{tasks.length}</p>
          <p className="text-sm text-gray-400 mt-1">across all projects</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">in progress</h3>
          <p className="text-3xl font-bold text-yellow-400">{inProgressTasks.length}</p>
          <p className="text-sm text-gray-400 mt-1">currently active</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">completed</h3>
          <p className="text-3xl font-bold text-green-400">{completedTasks.length}</p>
          <p className="text-sm text-gray-400 mt-1">tasks finished</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">recent tasks</h3>
        </div>
        
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <p>No tasks found. Create your first task to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="p-6 hover:bg-gray-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-white mb-2">
                      {task.title}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <span className="mr-2">👤</span>
                        {task.assigneeName || 'Unassigned'}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-2">📅</span>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-2">📂</span>
                        {task.projectName}
                      </span>
                      <span className={`flex items-center ${priorityColors[task.priority as keyof typeof priorityColors] || 'text-gray-400'}`}>
                        <span className="mr-2">⚡</span>
                        {task.priority.toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColors[task.workflowStateName as keyof typeof statusColors] || 'bg-gray-600'}`}>
                      {task.workflowStateName.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
