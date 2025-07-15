import { useState, useEffect } from 'react';
import type { WorkflowState, WorkflowTransition } from '../../services/workflow';
import { workflowService } from '../../services/workflow';

interface TaskStatusBadgeProps {
  currentState: WorkflowState;
  projectId: number;
  onStateChange: (newStateId: number) => void;
  disabled?: boolean;
}

export default function TaskStatusBadge({ 
  currentState, 
  projectId,
  onStateChange, 
  disabled = false 
}: TaskStatusBadgeProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [validTransitions, setValidTransitions] = useState<WorkflowTransition[]>([]);
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransitions = async () => {
      try {
        setIsLoading(true);
        const [transitions, states] = await Promise.all([
          workflowService.getWorkflowTransitions(projectId),
          workflowService.getWorkflowStates(projectId)
        ]);
        
        // filter transitions that start from current state
        const validFromCurrent = transitions.filter(t => t.fromStateId === currentState.id);
        setValidTransitions(validFromCurrent);
        setWorkflowStates(states);
      } catch (error) {
        console.error('failed to fetch workflow transitions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransitions();
  }, [currentState.id, projectId]);

  const getStateColor = (color?: string) => {
    switch (color) {
      case '#gray': return 'bg-gray-500';
      case '#blue': return 'bg-blue-500';
      case '#yellow': return 'bg-yellow-500';
      case '#green': return 'bg-green-500';
      case '#red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleStateChange = (newStateId: number) => {
    onStateChange(newStateId);
    setIsDropdownOpen(false);
  };

  if (disabled) {
    // show only current state if explicitly disabled
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getStateColor(currentState.color)}`}>
        {currentState.name}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white hover:opacity-80 transition-opacity ${getStateColor(currentState.color)}`}
        disabled={isLoading}
      >
        {currentState.name}
        <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <>
          {/* overlay to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* dropdown menu */}
          <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-20">
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-400 border-b border-gray-700">
                available transitions:
              </div>
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  loading transitions...
                </div>
              ) : validTransitions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  no valid transitions available
                </div>
              ) : (
                validTransitions.map((transition) => {
                  const targetState = workflowStates.find((s: WorkflowState) => s.id === transition.toStateId);
                  if (!targetState) return null;
                  
                  return (
                    <button
                      key={transition.id}
                      onClick={() => handleStateChange(transition.toStateId)}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <span className={`w-2 h-2 rounded-full ${getStateColor(targetState.color)}`}></span>
                      <span>{transition.name || targetState.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
