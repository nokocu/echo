using System.ComponentModel.DataAnnotations;

namespace backend.Models;

// audit trail for workflow state changes
public class WorkflowAuditEntry
{
    public int Id { get; set; }
    
    [Required]
    public int TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;
    
    [Required]
    public int FromStateId { get; set; }
    public WorkflowState FromState { get; set; } = null!;
    
    [Required]
    public int ToStateId { get; set; }
    public WorkflowState ToState { get; set; } = null!;
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;
    
    public string? Comment { get; set; }
    
    [Required]
    public DateTime TransitionedAt { get; set; } = DateTime.UtcNow;
    
    public string? SystemInfo { get; set; }
}
