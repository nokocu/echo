import { useState } from 'react';
import type { WorkflowState } from '../../services/workflow';

interface TaskStatusBadgeProps {
  currentState: WorkflowState;
  availableStates: WorkflowState[];
  onStateChange: (newStateId: number) => void;
  disabled?: boolean;
}

export default function TaskStatusBadge({ 
  currentState, 
  availableStates, 
  onStateChange, 
  disabled = false 
}: TaskStatusBadgeProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  if (disabled || availableStates.length <= 1) {
    // show only current state if there is no option to change
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
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white hover:opacity-80 transition-opacity ${getStateColor(currentState.color)}`}
      >
        {currentState.name}
        <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <>
          {/* Overlay to close the dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-20">
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-400 border-b border-gray-700">
                Change status to:
              </div>
              {availableStates
                .filter(state => state.id !== currentState.id)
                .map((state) => (
                  <button
                    key={state.id}
                    onClick={() => handleStateChange(state.id)}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <span className={`w-2 h-2 rounded-full ${getStateColor(state.color)}`}></span>
                    <span>{state.name}</span>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
