import { useState, useEffect } from 'react';
import { workflowService } from '../../services/workflow';
import type { WorkflowAuditEntry } from '../../services/workflow';

interface TaskAuditHistoryProps {
  taskId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskAuditHistory({ taskId, isOpen, onClose }: TaskAuditHistoryProps) {
  const [auditEntries, setAuditEntries] = useState<WorkflowAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && taskId) {
      loadAuditHistory();
    }
  }, [isOpen, taskId]);

  const loadAuditHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await workflowService.getTaskAuditHistory(taskId);
      setAuditEntries(history);
    } catch (err: any) {
      setError(err.message || 'Failed to load task history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Task History</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Loading history...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {!loading && !error && auditEntries.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No history available for this task.
            </div>
          )}

          {!loading && !error && auditEntries.length > 0 && (
            <div className="space-y-4">
              {auditEntries.map((entry) => (
                <div key={entry.id} className="border border-gray-700 rounded-lg p-4 bg-gray-750">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400 font-medium">
                          {entry.fromStateName}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-400 font-medium">
                          {entry.toStateName}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-400">
                        <div>
                          Changed by: <span className="text-gray-300">{entry.userName}</span>
                        </div>
                        <div>
                          Date: <span className="text-gray-300">{formatDate(entry.transitionedAt)}</span>
                        </div>
                      </div>

                      {entry.comment && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-400">Comment:</span>
                          <span className="text-gray-300 ml-2">{entry.comment}</span>
                        </div>
                      )}

                      {entry.systemInfo && (
                        <div className="mt-2 text-xs text-gray-500">
                          System info: {entry.systemInfo}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
