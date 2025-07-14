using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public enum TaskPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public class TaskItem
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;
    
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    // relationships
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    
    public string? AssigneeId { get; set; }
    public User? Assignee { get; set; }
    
    public int WorkflowStateId { get; set; }
    public WorkflowState WorkflowState { get; set; } = null!;
}
