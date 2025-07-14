import { useState, useEffect } from 'react';
import { tasksService } from '../../services/tasks';
import type { TaskItem } from '../../types/api';
import CreateTaskModal from './CreateTaskModal';

const statusColumns = [
  { key: 'TODO', title: 'To Do', color: 'bg-gray-600' },
  { key: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-600' },
  { key: 'COMPLETED', title: 'Completed', color: 'bg-green-600' },
  { key: 'BLOCKED', title: 'Blocked', color: 'bg-red-600' },
];

const priorityColors = {
  'Low': 'border-l-green-400',
  'Medium': 'border-l-yellow-400',
  'High': 'border-l-red-400',
  'Critical': 'border-l-red-600',
};

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await tasksService.getTasks();
      setTasks(tasksData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskCreated = () => {
    fetchTasks();
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.workflowStateName === status);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-white">Loading tasks...</div>
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

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">kanban board</h2>
            <p className="text-gray-400">drag and drop tasks to update status</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusColumns.map((column) => {
          const columnTasks = getTasksByStatus(column.key);
          
          return (
            <div key={column.key} className="bg-gray-800 rounded-lg border border-gray-700">
              <div className={`p-4 ${column.color} rounded-t-lg`}>
                <h3 className="text-white font-semibold flex items-center justify-between">
                  {column.title}
                  <span className="bg-gray-900 text-xs px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </h3>
              </div>

              <div className="p-4 space-y-3 min-h-[400px]">
                {columnTasks.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-8">
                    No tasks in {column.title.toLowerCase()}
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`bg-gray-700 rounded-lg p-4 border-l-4 hover:bg-gray-650 transition-colors cursor-pointer ${
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

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center">
                            📂 {task.projectName}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {task.dueDate && (
                            <span className="flex items-center">
                              📅 {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs ${
                            task.priority === 'Critical' ? 'bg-red-900 text-red-200' :
                            task.priority === 'High' ? 'bg-red-800 text-red-200' :
                            task.priority === 'Medium' ? 'bg-yellow-800 text-yellow-200' :
                            'bg-green-800 text-green-200'
                          }`}>
                            {task.priority.toLowerCase()}
                          </span>
                        </div>
                      </div>

                      {task.assigneeName && (
                        <div className="mt-2 text-xs text-gray-400">
                          👤 {task.assigneeName}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
