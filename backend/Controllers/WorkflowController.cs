using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using backend.Data;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WorkflowController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly WorkflowEngine _workflowEngine;
    private readonly ILogger<WorkflowController> _logger;

    public WorkflowController(
        ApplicationDbContext context, 
        WorkflowEngine workflowEngine,
        ILogger<WorkflowController> logger)
    {
        _context = context;
        _workflowEngine = workflowEngine;
        _logger = logger;
    }

    // GET: api/workflow/states/{projectId}
    [HttpGet("states/{projectId}")]
    public async Task<ActionResult<IEnumerable<WorkflowStateDto>>> GetWorkflowStates(int projectId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // verify project ownership
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerId == userId);
        
        if (project == null)
        {
            return NotFound("Project not found");
        }

        var states = await _context.WorkflowStates
            .Where(ws => ws.ProjectId == projectId)
            .OrderBy(ws => ws.Order)
            .Select(ws => new WorkflowStateDto
            {
                Id = ws.Id,
                Name = ws.Name,
                Type = ws.Type.ToString(),
                Order = ws.Order,
                Color = ws.Color,
                Description = ws.Description
            })
            .ToListAsync();

        return Ok(states);
    }

    // GET: api/workflow/transitions/{projectId}
    [HttpGet("transitions/{projectId}")]
    public async Task<ActionResult<IEnumerable<WorkflowTransitionDto>>> GetWorkflowTransitions(int projectId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // verify project ownership
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerId == userId);
        
        if (project == null)
        {
            return NotFound("Project not found");
        }

        var transitions = await _context.WorkflowTransitions
            .Include(wt => wt.FromState)
            .Include(wt => wt.ToState)
            .Where(wt => wt.FromState.ProjectId == projectId)
            .Select(wt => new WorkflowTransitionDto
            {
                Id = wt.Id,
                Name = wt.Name,
                FromStateId = wt.FromStateId,
                FromStateName = wt.FromState.Name,
                ToStateId = wt.ToStateId,
                ToStateName = wt.ToState.Name,
                Conditions = wt.Conditions,
                IsAutomatic = wt.IsAutomatic,
                Order = wt.Order
            })
            .ToListAsync();

        return Ok(transitions);
    }

    // POST: api/workflow/transition/{taskId}
    [HttpPost("transition/{taskId}")]
    public async Task<IActionResult> TransitionTask(int taskId, [FromBody] TransitionTaskRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("User {UserId} attempting to transition task {TaskId} to state {StateId}", 
            userId, taskId, request.ToStateId);

        try
        {
            var result = await _workflowEngine.TransitionAsync(taskId, request.ToStateId, userId, request.Comment);
            
            if (result.Success)
            {
                _logger.LogInformation("Task {TaskId} successfully transitioned to state {StateId}", 
                    taskId, request.ToStateId);
                return Ok(new { success = true, message = "Task transitioned successfully" });
            }
            else
            {
                _logger.LogWarning("Task transition failed: {ErrorMessage}", result.ErrorMessage);
                return BadRequest(new { success = false, message = result.ErrorMessage });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error transitioning task {TaskId}", taskId);
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    // GET: api/workflow/audit/{taskId}
    [HttpGet("audit/{taskId}")]
    public async Task<ActionResult<IEnumerable<WorkflowAuditDto>>> GetTaskAuditHistory(int taskId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // verify task access
        var task = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.Project.OwnerId == userId);
        
        if (task == null)
        {
            return NotFound("Task not found");
        }

        var auditEntries = await _context.WorkflowAuditEntries
            .Include(wa => wa.FromState)
            .Include(wa => wa.ToState)
            .Include(wa => wa.User)
            .Where(wa => wa.TaskId == taskId)
            .OrderByDescending(wa => wa.TransitionedAt)
            .Select(wa => new WorkflowAuditDto
            {
                Id = wa.Id,
                FromStateName = wa.FromState.Name,
                ToStateName = wa.ToState.Name,
                UserName = wa.User.Email ?? "Unknown",
                Comment = wa.Comment,
                TransitionedAt = wa.TransitionedAt,
                SystemInfo = wa.SystemInfo
            })
            .ToListAsync();

        return Ok(auditEntries);
    }

    // POST: api/workflow/process-automatic/{projectId}
    [HttpPost("process-automatic/{projectId}")]
    public async Task<IActionResult> ProcessAutomaticTransitions(int projectId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // verify project ownership
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerId == userId);
        
        if (project == null)
        {
            return NotFound("Project not found");
        }

        _logger.LogInformation("Processing automatic transitions for project {ProjectId}", projectId);

        try
        {
            var processedTasks = await _workflowEngine.ProcessAutomaticTransitionsAsync(projectId);
            
            _logger.LogInformation("Processed {Count} automatic transitions for project {ProjectId}", 
                processedTasks.Count, projectId);
            
            return Ok(new { 
                success = true, 
                message = $"Processed {processedTasks.Count} automatic transitions",
                processedTasks = processedTasks.Select(t => new { t.Id, t.Title }).ToList()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing automatic transitions for project {ProjectId}", projectId);
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }
}

// DTOs for API responses
public class WorkflowStateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Order { get; set; }
    public string? Color { get; set; }
    public string? Description { get; set; }
}

public class WorkflowTransitionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int FromStateId { get; set; }
    public string FromStateName { get; set; } = string.Empty;
    public int ToStateId { get; set; }
    public string ToStateName { get; set; } = string.Empty;
    public string? Conditions { get; set; }
    public bool IsAutomatic { get; set; }
    public int Order { get; set; }
}

public class WorkflowAuditDto
{
    public int Id { get; set; }
    public string FromStateName { get; set; } = string.Empty;
    public string ToStateName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public DateTime TransitionedAt { get; set; }
    public string? SystemInfo { get; set; }
}

public class TransitionTaskRequest
{
    public int ToStateId { get; set; }
    public string? Comment { get; set; }
}
