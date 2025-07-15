using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class WorkflowProjectAssignment
{
    public int Id { get; set; }
    
    public int WorkflowId { get; set; }
    public BpmnWorkflow Workflow { get; set; } = null!;
    
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UnassignedAt { get; set; }
}
