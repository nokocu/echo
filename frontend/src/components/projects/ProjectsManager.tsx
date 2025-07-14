import { useState, useEffect } from 'react';
import { tasksService } from '../../services/tasks';
import type { Project } from '../../types/api';

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    // TODO: implement project creation modal
    alert('Project creation coming soon!');
  };

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
            <p className="text-gray-400">Manage your projects and their workflow configurations</p>
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
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:bg-gray-750 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{project.name}</h3>
        <div className="flex space-x-2">
          <button
            className="text-gray-400 hover:text-blue-400 transition-colors"
            title="Edit project"
          >
            ✏️
          </button>
          <button
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
        <div className="flex space-x-2">
          <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
            View Tasks
          </button>
          <button className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm">
            Configure Workflow
          </button>
        </div>
      </div>
    </div>
  );
}
