using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class WorkflowTransition
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    public bool RequiresApproval { get; set; } = false;
    
    [MaxLength(500)]
    public string? Conditions { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // relationships
    public int FromStateId { get; set; }
    public WorkflowState FromState { get; set; } = null!;
    
    public int ToStateId { get; set; }
    public WorkflowState ToState { get; set; } = null!;
}
