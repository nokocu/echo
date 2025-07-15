using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class Project
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    
    public string OwnerId { get; set; } = string.Empty;
    public User Owner { get; set; } = null!;
    
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<WorkflowState> WorkflowStates { get; set; } = new List<WorkflowState>();
    public ICollection<WorkflowProjectAssignment> WorkflowAssignments { get; set; } = new List<WorkflowProjectAssignment>();
}
