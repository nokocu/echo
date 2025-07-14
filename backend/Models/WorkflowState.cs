using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public enum WorkflowStateType
{
    Start = 1,
    InProgress = 2,
    Review = 3,
    Completed = 4,
    Cancelled = 5
}

public class WorkflowState
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    public WorkflowStateType Type { get; set; }
    
    public int Order { get; set; }
    
    [MaxLength(7)]
    public string Color { get; set; } = "#6B7280"; // default gray
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // relationships
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<WorkflowTransition> FromTransitions { get; set; } = new List<WorkflowTransition>();
    public ICollection<WorkflowTransition> ToTransitions { get; set; } = new List<WorkflowTransition>();
}
