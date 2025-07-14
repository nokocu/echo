using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TasksController> _logger;

    public TasksController(ApplicationDbContext context, ILogger<TasksController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskResponse>>> GetTasks()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        var tasks = await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Assignee)
            .Include(t => t.WorkflowState)
            .Where(t => t.Project.OwnerId == userId || t.AssigneeId == userId)
            .Select(t => new TaskResponse
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Priority = t.Priority.ToString(),
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                DueDate = t.DueDate,
                CompletedAt = t.CompletedAt,
                ProjectId = t.ProjectId,
                ProjectName = t.Project.Name,
                AssigneeId = t.AssigneeId,
                AssigneeName = t.Assignee != null ? $"{t.Assignee.FirstName} {t.Assignee.LastName}" : null,
                WorkflowStateId = t.WorkflowStateId,
                WorkflowStateName = t.WorkflowState.Name,
                WorkflowStateColor = t.WorkflowState.Color
            })
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TaskResponse>> GetTask(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        var task = await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Assignee)
            .Include(t => t.WorkflowState)
            .Where(t => t.Id == id && (t.Project.OwnerId == userId || t.AssigneeId == userId))
            .Select(t => new TaskResponse
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Priority = t.Priority.ToString(),
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                DueDate = t.DueDate,
                CompletedAt = t.CompletedAt,
                ProjectId = t.ProjectId,
                ProjectName = t.Project.Name,
                AssigneeId = t.AssigneeId,
                AssigneeName = t.Assignee != null ? $"{t.Assignee.FirstName} {t.Assignee.LastName}" : null,
                WorkflowStateId = t.WorkflowStateId,
                WorkflowStateName = t.WorkflowState.Name,
                WorkflowStateColor = t.WorkflowState.Color
            })
            .FirstOrDefaultAsync();

        if (task == null)
            return NotFound();

        return Ok(task);
    }

    [HttpPost]
    public async Task<ActionResult<TaskResponse>> CreateTask([FromBody] CreateTaskRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        // verify user owns the project
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.OwnerId == userId);
        
        if (project == null)
            return BadRequest("Project not found or access denied");

        // get default workflow state for project
        var defaultState = await _context.WorkflowStates
            .Where(w => w.ProjectId == request.ProjectId && w.Type == WorkflowStateType.Start)
            .OrderBy(w => w.Order)
            .FirstOrDefaultAsync();

        if (defaultState == null)
            return BadRequest("No starting workflow state found for project");

        var task = new TaskItem
        {
            Title = request.Title,
            Description = request.Description,
            Priority = Enum.Parse<TaskPriority>(request.Priority),
            DueDate = request.DueDate,
            ProjectId = request.ProjectId,
            AssigneeId = request.AssigneeId,
            WorkflowStateId = defaultState.Id
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // return created task with full details
        var createdTask = await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Assignee)
            .Include(t => t.WorkflowState)
            .Where(t => t.Id == task.Id)
            .Select(t => new TaskResponse
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Priority = t.Priority.ToString(),
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                DueDate = t.DueDate,
                CompletedAt = t.CompletedAt,
                ProjectId = t.ProjectId,
                ProjectName = t.Project.Name,
                AssigneeId = t.AssigneeId,
                AssigneeName = t.Assignee != null ? $"{t.Assignee.FirstName} {t.Assignee.LastName}" : null,
                WorkflowStateId = t.WorkflowStateId,
                WorkflowStateName = t.WorkflowState.Name,
                WorkflowStateColor = t.WorkflowState.Color
            })
            .FirstAsync();

        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, createdTask);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        var task = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id && (t.Project.OwnerId == userId || t.AssigneeId == userId));

        if (task == null)
            return NotFound();

        task.Title = request.Title;
        task.Description = request.Description;
        task.Priority = Enum.Parse<TaskPriority>(request.Priority);
        task.DueDate = request.DueDate;
        task.AssigneeId = request.AssigneeId;
        task.UpdatedAt = DateTime.UtcNow;

        // handle workflow state change
        if (request.WorkflowStateId.HasValue && request.WorkflowStateId.Value != task.WorkflowStateId)
        {
            // verify state belongs to same project
            var newState = await _context.WorkflowStates
                .FirstOrDefaultAsync(w => w.Id == request.WorkflowStateId.Value && w.ProjectId == task.ProjectId);
            
            if (newState != null)
            {
                task.WorkflowStateId = request.WorkflowStateId.Value;
                
                // mark as completed if moving to completed state
                if (newState.Type == WorkflowStateType.Completed)
                {
                    task.CompletedAt = DateTime.UtcNow;
                }
                else
                {
                    task.CompletedAt = null;
                }
            }
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        var task = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id && t.Project.OwnerId == userId);

        if (task == null)
            return NotFound();

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("projects")]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetProjects()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("GetProjects: User ID not found in claims");
                return Unauthorized();
            }

            _logger.LogInformation("GetProjects called by user {UserId}", userId);

            var projects = await _context.Projects
                .Where(p => p.OwnerId == userId)
                .Select(p => new ProjectDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description
                })
                .ToListAsync();

            if (!projects.Any())
            {
                _logger.LogInformation("No projects found for user {UserId}, creating default project", userId);
                
                // Create default project for user
                var defaultProject = new Project
                {
                    Name = "My Default Project",
                    Description = "Default project created automatically",
                    OwnerId = userId,
                    StartDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Projects.Add(defaultProject);
                await _context.SaveChangesAsync();

                // Create default workflow states for the project
                await CreateDefaultWorkflowStatesAsync(defaultProject.Id);

                projects = new List<ProjectDto>
                {
                    new ProjectDto
                    {
                        Id = defaultProject.Id,
                        Name = defaultProject.Name,
                        Description = defaultProject.Description
                    }
                };

                _logger.LogInformation("Created default project {ProjectId} for user {UserId}", defaultProject.Id, userId);
            }

            _logger.LogInformation("Returning {Count} projects for user {UserId}", projects.Count, userId);
            return Ok(projects);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting projects for user");
            return StatusCode(500, "Internal server error");
        }
    }

    private async Task CreateDefaultWorkflowStatesAsync(int projectId)
    {
        var defaultStates = new[]
        {
            new WorkflowState { Name = "Todo", Type = WorkflowStateType.Start, Order = 1, ProjectId = projectId, Color = "#gray", IsActive = true },
            new WorkflowState { Name = "In Progress", Type = WorkflowStateType.InProgress, Order = 2, ProjectId = projectId, Color = "#blue", IsActive = true },
            new WorkflowState { Name = "Review", Type = WorkflowStateType.Review, Order = 3, ProjectId = projectId, Color = "#yellow", IsActive = true },
            new WorkflowState { Name = "Done", Type = WorkflowStateType.Completed, Order = 4, ProjectId = projectId, Color = "#green", IsActive = true }
        };

        _context.WorkflowStates.AddRange(defaultStates);
        await _context.SaveChangesAsync();
    }
}

public class TaskResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? AssigneeId { get; set; }
    public string? AssigneeName { get; set; }
    public int WorkflowStateId { get; set; }
    public string WorkflowStateName { get; set; } = string.Empty;
    public string WorkflowStateColor { get; set; } = string.Empty;
}

public class CreateTaskRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium";
    public DateTime? DueDate { get; set; }
    public int ProjectId { get; set; }
    public string? AssigneeId { get; set; }
}

public class UpdateTaskRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium";
    public DateTime? DueDate { get; set; }
    public string? AssigneeId { get; set; }
    public int? WorkflowStateId { get; set; }
}

public class ProjectDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
