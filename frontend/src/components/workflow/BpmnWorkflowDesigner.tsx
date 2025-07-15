import { useEffect, useRef, useState } from 'react';
import BpmnJS from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import { bpmnService } from '../../services/bpmn';
import type { BpmnWorkflowDetail, SaveBpmnWorkflowRequest } from '../../services/bpmn';

interface BpmnWorkflowDesignerProps {
  workflowId: number;
  projectId?: number | null;
  onSave?: (workflow: BpmnWorkflowDetail) => void;
  onClose?: () => void;
}

export default function BpmnWorkflowDesigner({ 
  workflowId, 
  projectId, 
  onSave, 
  onClose 
}: BpmnWorkflowDesignerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnJS | null>(null);
  const [workflow, setWorkflow] = useState<BpmnWorkflowDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true); 
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const initializationRef = useRef(false);
  
  // yse useEffect with more robust DOM detection
  useEffect(() => {
    // prevent double initialization
    if (modelerRef.current || initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    
    // add a small delay to avoid React StrictMode double execution issues
    const initTimeout = setTimeout(() => {
      // doublecheck that were still supposed to initialize
      if (modelerRef.current || !initializationRef.current) {
        return;
      }
      
      // retry mechanism to wait for DOM elements to be ready
      let attempts = 0;
      const maxAttempts = 20; // 2 seconds max
      
      const initializeBpmn = () => {
        attempts++;
        
        const container = containerRef.current;
        const propertiesPanel = document.getElementById('properties-panel');
        
        
        // final check before proceeding
        if (modelerRef.current) {
          return;
        }
        
        if (!container) {
          if (attempts >= maxAttempts) {
            console.error('❌ Container ref is null after max attempts');
            setError('Container element not found after maximum attempts');
            setInitializing(false);
            initializationRef.current = false;
            return;
          }
          
          setTimeout(initializeBpmn, 100);
          return;
        }

        if (!propertiesPanel) {
          if (attempts >= maxAttempts) {
            console.error('❌ Properties panel element not found after max attempts');
            setError('Properties panel element not found after maximum attempts');
            setInitializing(false);
            initializationRef.current = false;
            return;
          }
          
          setTimeout(initializeBpmn, 100);
          return;
        }

        
        try {
          // clear any existing content in the container to avoid conflicts
          container.innerHTML = '';
          propertiesPanel.innerHTML = '';
          
          // create modeler instance
          const modeler = new BpmnJS({
            container: container,
            propertiesPanel: {
              parent: '#properties-panel'
            }
          });

          modelerRef.current = modeler;
          setInitializing(false); // Initialization complete

          // load and import the workflow
          loadWorkflow(modeler);
          
        } catch (err: any) {
          console.error('Failed to initialize BPMN modeler:', err);
          setError('Failed to initialize BPMN modeler: ' + err.message);
          setInitializing(false);
          initializationRef.current = false;
        }
      };
      
      // start initialization
      initializeBpmn();
    }, 100); // add delay (uhmmm)

    return () => {
      clearTimeout(initTimeout);
      if (modelerRef.current) {
        try {
          modelerRef.current.destroy();
        } catch (err) {
          console.warn('Error during modeler cleanup:', err);
        }
        modelerRef.current = null;
      }
      initializationRef.current = false;
    };
  }, [workflowId]); // only depend on workflowId

  const loadWorkflow = async (modeler?: BpmnJS) => {
    const activeModeler = modeler || modelerRef.current;
    if (!activeModeler) {
      console.error('No modeler available');
      setError('BPMN modeler not initialized');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      
      // load workflow data from API
      const workflowData = await bpmnService.getWorkflow(workflowId);
      
      setWorkflow(workflowData);
      setWorkflowName(workflowData.name);
      setWorkflowDescription(workflowData.description);
    
      // zoom to fit the diagram
      const canvas = activeModeler.get('canvas') as any;
      canvas.zoom('fit-viewport');
      
    } catch (err: any) {
      console.error('Error loading workflow:', err);
      setError(err.message || 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const saveWorkflow = async () => {
    if (!modelerRef.current || !workflow) return;

    try {
      setSaving(true);
      setError(null);

      // get the updated BPMN XML from the modeler
      const result = await modelerRef.current.saveXML({ format: true });
      const bpmnXml = result.xml;

      if (!bpmnXml) {
        throw new Error('Failed to export BPMN XML');
      }

      // extract elements and connections from the modeler
      const elementRegistry = modelerRef.current.get('elementRegistry') as any;
      const elements: any[] = [];
      const connections: any[] = [];

      elementRegistry.forEach((element: any) => {
        if (element.type === 'bpmn:SequenceFlow') {
          connections.push({
            id: 0,
            connectionId: element.id,
            sourceElementId: element.source?.id || '',
            targetElementId: element.target?.id || '',
            name: element.businessObject?.name || '',
            condition: element.businessObject?.conditionExpression?.body || '',
            waypoints: JSON.stringify(element.waypoints || [])
          });
        } else if (element.businessObject) {
          elements.push({
            id: 0,
            elementId: element.id,
            elementType: element.type,
            name: element.businessObject?.name || '',
            properties: JSON.stringify(element.businessObject || {}),
            x: element.x || 0,
            y: element.y || 0,
            width: element.width || 100,
            height: element.height || 80
          });
        }
      });

      const saveRequest: SaveBpmnWorkflowRequest = {
        name: workflowName,
        description: workflowDescription,
        bpmnXml: bpmnXml,
        bpmnJson: JSON.stringify({ elements, connections }),
        elements: elements,
        connections: connections
      };

      const updatedWorkflow = await bpmnService.saveWorkflow(workflowId, saveRequest);
      setWorkflow(updatedWorkflow);
      
      if (onSave) {
        onSave(updatedWorkflow);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const activateWorkflow = async () => {
    try {
      await bpmnService.activateWorkflow(workflowId);
      // refresh workflow data to get updated status
      await loadWorkflow();
    } catch (err: any) {
      setError(err.message || 'Failed to activate workflow');
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setError(null);
              setInitializing(true);
              initializationRef.current = false;
              if (modelerRef.current) {
                modelerRef.current.destroy();
                modelerRef.current = null;
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 relative" key={`bpmn-designer-${workflowId}`}>
      {/* Loading overlay */}
      {(initializing || loading) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400 mt-4">
            {initializing ? 'Initializing BPMN designer...' : 'Loading workflow...'}
          </span>
          <p className="text-gray-500 text-sm mt-2">This may take a moment to initialize BPMN.js</p>
        </div>
      )}
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Workflow name"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {workflow?.isActive && (
              <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                Active
              </span>
            )}
            <button
              onClick={activateWorkflow}
              disabled={workflow?.isActive}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {workflow?.isActive ? 'Active' : 'Activate'}
            </button>
            <button
              onClick={saveWorkflow}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BPMN Designer */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main diagram area */}
        <div className="flex-1 relative">
          <div 
            ref={containerRef}
            key={`bpmn-container-${workflowId}`}
            className="absolute inset-0 bg-gray-300"
            style={{ 
              height: '100%', 
              width: '100%'
            }}
          />
        </div>

        {/* Properties panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div 
            id="properties-panel" 
            key={`properties-panel-${workflowId}`}
            className="h-full"
          ></div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 border-t border-gray-700 p-3 text-sm text-gray-400">
        <div className="flex items-center justify-between">
          <div>
            <strong>Instructions:</strong> Drag elements from the palette to create your workflow. 
            Connect elements with sequence flows. Save to update the workflow.
          </div>
          <div className="text-xs">
            Version {workflow?.version} • Project ID: {projectId}
          </div>
        </div>
      </div>
    </div>
  );
}
