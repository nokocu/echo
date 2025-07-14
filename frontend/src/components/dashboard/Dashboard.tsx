const mockTasks = [
  {
    id: 1,
    title: 'do a task',
    status: 'in progress',
    priority: 'high',
    assignee: 'guy',
    dueDate: '14.07.2025',
  },
  {
    id: 2,
    title: 'do a different task',
    status: 'completed',
    priority: 'medium',
    assignee: 'some guy',
    dueDate: '14.07.2025',
  },
  {
    id: 3,
    title: 'dont do the task',
    status: 'todo',
    priority: 'high',
    assignee: 'some other guy',
    dueDate: '14.07.2025',
  },
];

const statusColors = {
  'todo': 'bg-gray-600',
  'in progress': 'bg-blue-600',
  'completed': 'bg-green-600',
};

export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">project overview</h2>
        <p className="text-gray-400">manage tasks and track progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">total tasks</h3>
          <p className="text-3xl font-bold text-blue-400">12</p>
          <p className="text-sm text-gray-400 mt-1">+3 from last week</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">in progress</h3>
          <p className="text-3xl font-bold text-yellow-400">5</p>
          <p className="text-sm text-gray-400 mt-1">2 due today</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">completed</h3>
          <p className="text-3xl font-bold text-green-400">7</p>
          <p className="text-sm text-gray-400 mt-1">this week</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">recent tasks</h3>
        </div>
        
        <div className="divide-y divide-gray-700">
          {mockTasks.map((task) => (
            <div key={task.id} className="p-6 hover:bg-gray-750 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-white mb-2">
                    {task.title}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <span className="mr-2">👤</span>
                      {task.assignee}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-2">📅</span>
                      {task.dueDate}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-2">⚡</span>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColors[task.status as keyof typeof statusColors]}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
