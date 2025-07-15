using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class BpmnWorkflow
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    // BPMN XML definition
    public string BpmnXml { get; set; } = string.Empty;
    
    // JSON representation for easier querying
    public string BpmnJson { get; set; } = string.Empty;
    
    public int? ProjectId { get; set; }
    public Project? Project { get; set; }
    
    public string OwnerId { get; set; } = string.Empty;
    public User Owner { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsActive { get; set; } = true;
    
    // Version control for workflows
    public int Version { get; set; } = 1;
    public int? ParentWorkflowId { get; set; }
    public BpmnWorkflow? ParentWorkflow { get; set; }
    
    // Navigation properties
    public ICollection<BpmnWorkflow> ChildWorkflows { get; set; } = new List<BpmnWorkflow>();
    public ICollection<WorkflowProjectAssignment> ProjectAssignments { get; set; } = new List<WorkflowProjectAssignment>();
}

public class BpmnElement
{
    public int Id { get; set; }
    
    [Required]
    public string ElementId { get; set; } = string.Empty; // BPMN element ID
    
    [Required]
    public string ElementType { get; set; } = string.Empty; // startEvent, task, gateway, endEvent
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string Properties { get; set; } = "{}"; // JSON properties
    
    public int WorkflowId { get; set; }
    public BpmnWorkflow Workflow { get; set; } = null!;
    
    // Position in the diagram
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; } = 100;
    public double Height { get; set; } = 80;
}

public class BpmnConnection
{
    public int Id { get; set; }
    
    [Required]
    public string ConnectionId { get; set; } = string.Empty; // BPMN connection ID
    
    [Required]
    public string SourceElementId { get; set; } = string.Empty;
    
    [Required] 
    public string TargetElementId { get; set; } = string.Empty;
    
    public string Name { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty; // for conditional flows
    
    public int WorkflowId { get; set; }
    public BpmnWorkflow Workflow { get; set; } = null!;
    
    // Visual properties
    public string Waypoints { get; set; } = "[]"; // JSON array of waypoints
}
