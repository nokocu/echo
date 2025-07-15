import { useEffect, useState } from 'react';
import { tasksService } from '../../services/tasks';
import type { TaskItem, Project } from '../../types/api';
import CreateTaskModal from '../tasks/CreateT';

// Function to create diagonal stripe pattern for cards
const getCardPatternStyle = (color: string) => {
  return {
    backgroundImage: `repeating-linear-gradient(315deg, ${color}99 0, ${color}99 1px, transparent 0, transparent 50%)`,
    backgroundSize: '10px 10px',
    backgroundAttachment: 'fixed'
  } as React.CSSProperties;
};

const statusColors = {
  'Todo': 'bg-gray-600',
  'In Progress': 'bg-blue-600',
  'Review': 'bg-yellow-600',
  'Done': 'bg-green-600',
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
      
      const projectsData = await tasksService.getProjects();
      setProjects(projectsData);
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

  const todoTasks = tasks.filter(task => task.workflowStateName === 'Todo');
  const inProgressTasks = tasks.filter(task => task.workflowStateName === 'In Progress');
  const reviewTasks = tasks.filter(task => task.workflowStateName === 'Review');
  const completedTasks = tasks.filter(task => task.workflowStateName === 'Done');
  return (
    <div className="isolate mx-auto grid w-full max-w-2xl grid-cols-1 gap-10 pt-10 md:pb-24 xl:max-w-5xl">
      <div className="px-4 sm:px-6">
        <div>
          
            <p data-section="true" className="font-mono text-xs/6 font-medium tracking-widest text-gray-600 uppercase dark:text-gray-400">Manage tasks and track progress</p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">Dashboard overview</h1>

          
        </div>



        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8 mt-6">
          <div className="p-6 border border-gray-700 rounded">
            <h3 className="text-lg font-semibold text-white mb-2">Total tasks</h3>
            <p className="text-3xl font-bold text-white">{tasks.length}</p>
            <p className="text-sm text-gray-400 mt-1">across all projects</p>
          </div>
          <div className="p-6 border border-gray-700 rounded">
            <h3 className="text-lg font-semibold text-white mb-2">Total projects</h3>
            <p className="text-3xl font-bold text-white">{projects.length}</p>
            <p className="text-sm text-gray-400 mt-1">active workspaces</p>
          </div>
        </div>




      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <div className="bg-gray-900 p-6 border border-gray-700 rounded">
          <h3 className="text-lg font-semibold text-white mb-2">Todo</h3>
          <p className="text-3xl font-bold text-gray-400">{todoTasks.length}</p>
          <p className="text-sm text-gray-400 mt-1">ready to start</p>
        </div>
        
        <div className="bg-gray-900 p-6 border border-gray-700 rounded">
          <h3 className="text-lg font-semibold text-white mb-2">In progress</h3>
          <p className="text-3xl font-bold text-blue-400">{inProgressTasks.length}</p>
          <p className="text-sm text-gray-400 mt-1">currently active</p>
        </div>

        <div className="bg-gray-900 p-6 border border-gray-700 rounded">
          <h3 className="text-lg font-semibold text-white mb-2">In review</h3>
          <p className="text-3xl font-bold text-yellow-400">{reviewTasks.length}</p>
          <p className="text-sm text-gray-400 mt-1">awaiting review</p>
        </div>
        
        <div className="bg-gray-900 p-6 border border-gray-700 rounded">
          <h3 className="text-lg font-semibold text-white mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-400">{completedTasks.length}</p>
          <p className="text-sm text-gray-400 mt-1">tasks finished</p>
        </div>
      </div>

      <div className="border border-gray-700 rounded">
        <div className="" style={getCardPatternStyle('#6b7280')}>
          <div className="bg-gray-900/70 p-6 rounded-t border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">Recent tasks</h3>
          </div>
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
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                        </svg>
                        {task.projectName}
                      </span>
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z" />
                        </svg>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </span>
                      <span className={`flex items-center ${priorityColors[task.priority as keyof typeof priorityColors] || 'text-gray-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                        </svg>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColors[task.workflowStateName as keyof typeof statusColors] || 'bg-gray-600'}`}>
                      {task.workflowStateName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
