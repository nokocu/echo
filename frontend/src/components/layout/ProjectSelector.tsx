import { useState, useEffect } from 'react';
import { tasksService } from '../../services/tasks';

interface Project {
  id: number;
  name: string;
  description: string;
}

interface ProjectSelectorProps {
  selectedProjectId: number | null;
  onProjectChange: (projectId: number) => void;
  onCreateProject: () => void;
}

export default function ProjectSelector({ selectedProjectId, onProjectChange}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsData = await tasksService.getProjects();
      setProjects(projectsData);
      
      // when none selected, choose first
      if (!selectedProjectId && projectsData.length > 0) {
        onProjectChange(projectsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-gray-400">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-300">Project:</label>
        <select
          value={selectedProjectId || ''}
          onChange={(e) => onProjectChange(parseInt(e.target.value))}
          className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
