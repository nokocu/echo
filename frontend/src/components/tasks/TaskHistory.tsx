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
      <div className="bg-gray-900 rounded border border-gray-700 max-w-2xl w-full max-h-[80vh]">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs/6 font-medium tracking-widest text-gray-600 uppercase dark:text-gray-400">
                Workflow transitions
              </p>
              <h2 className="mt-1 text-xl font-medium tracking-tight text-white">
                Task History
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-12 mx-auto mb-3 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
              No history available for this task.
            </div>
          )}

          {!loading && !error && auditEntries.length > 0 && (
            <div className="space-y-4">
              {auditEntries.map((entry) => (
                <div key={entry.id} className="border border-gray-700 rounded p-4 bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400 font-medium">
                          {entry.fromStateName}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                        <span className="text-green-400 font-medium">
                          {entry.toStateName}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-400">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                            <span className="text-gray-300">{entry.userName}</span>
                          </span>
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z" />
                            </svg>
                            <span className="text-gray-300">{formatDate(entry.transitionedAt)}</span>
                          </span>
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
            className="w-full px-4 py-2 text-white rounded transition-colors"
            style={{ backgroundColor: '#6b728080' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
