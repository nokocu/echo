import { useState } from 'react';
import { tasksService } from '../../services/tasks';
import type { Project } from '../../services/tasks';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectDeleted: () => void;
  project: Project | null;
}

export default function DeleteProjectModal({ isOpen, onClose, onProjectDeleted, project }: DeleteProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!project) return;

    try {
      setLoading(true);
      setError(null);
      
      await tasksService.deleteProject(project.id);
      
      onProjectDeleted();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError('Cannot delete project with existing tasks. Please delete or move all tasks first.');
      } else {
        setError(err.message || 'Failed to delete project');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Delete Project</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete the project <strong className="text-white">"{project.name}"</strong>?
            </p>
            <div className="bg-red-900/30 border border-red-700/50 text-red-200 px-4 py-3 rounded text-sm">
              <div className="flex items-start">
                <span className="text-red-400 mr-2">⚠️</span>
                <div>
                  <div className="font-medium">This action cannot be undone.</div>
                  <div className="text-sm mt-1">
                    This will permanently delete the project, its workflow states, and transitions.
                    Tasks must be deleted first.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Project'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
