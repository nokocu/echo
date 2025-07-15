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
public class BpmnController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BpmnController> _logger;

    public BpmnController(ApplicationDbContext context, ILogger<BpmnController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/bpmn/workflows/{projectId}
    [HttpGet("workflows/{projectId}")]
    public async Task<ActionResult<IEnumerable<BpmnWorkflowDto>>> GetWorkflows(int projectId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Verify project ownership
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerId == userId);
        
        if (project == null)
        {
            return NotFound("Project not found");
        }

        var workflows = await _context.BpmnWorkflows
            .Where(w => w.ProjectId == projectId)
            .OrderBy(w => w.CreatedAt)
            .Select(w => new BpmnWorkflowDto
            {
                Id = w.Id,
                Name = w.Name,
                Description = w.Description,
                ProjectId = w.ProjectId,
                IsActive = w.IsActive,
                Version = w.Version,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt
            })
            .ToListAsync();

        return Ok(workflows);
    }

    // GET: api/bpmn/workflow/{workflowId}
    [HttpGet("workflow/{workflowId}")]
    public async Task<ActionResult<BpmnWorkflowDetailDto>> GetWorkflow(int workflowId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var workflow = await _context.BpmnWorkflows
            .Include(w => w.Project)
            .FirstOrDefaultAsync(w => w.Id == workflowId && w.OwnerId == userId);
        
        if (workflow == null)
        {
            return NotFound("Workflow not found");
        }

        var elements = await _context.BpmnElements
            .Where(e => e.WorkflowId == workflowId)
            .ToListAsync();

        var connections = await _context.BpmnConnections
            .Where(c => c.WorkflowId == workflowId)
            .ToListAsync();

        var result = new BpmnWorkflowDetailDto
        {
            Id = workflow.Id,
            Name = workflow.Name,
            Description = workflow.Description,
            BpmnXml = workflow.BpmnXml,
            BpmnJson = workflow.BpmnJson,
            ProjectId = workflow.ProjectId,
            IsActive = workflow.IsActive,
            Version = workflow.Version,
            CreatedAt = workflow.CreatedAt,
            UpdatedAt = workflow.UpdatedAt,
            Elements = elements.Select(e => new BpmnElementDto
            {
                Id = e.Id,
                ElementId = e.ElementId,
                ElementType = e.ElementType,
                Name = e.Name,
                Properties = e.Properties,
                X = e.X,
                Y = e.Y,
                Width = e.Width,
                Height = e.Height
            }).ToList(),
            Connections = connections.Select(c => new BpmnConnectionDto
            {
                Id = c.Id,
                ConnectionId = c.ConnectionId,
                SourceElementId = c.SourceElementId,
                TargetElementId = c.TargetElementId,
                Name = c.Name,
                Condition = c.Condition,
                Waypoints = c.Waypoints
            }).ToList()
        };

        return Ok(result);
    }

    // POST: api/bpmn/workflow
    [HttpPost("workflow")]
    public async Task<ActionResult<BpmnWorkflowDto>> CreateWorkflow([FromBody] CreateBpmnWorkflowRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // if ProjectId is provided, verify project ownership
        if (request.ProjectId.HasValue)
        {
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.OwnerId == userId);
            
            if (project == null)
            {
                return NotFound("Project not found");
            }
        }

        var workflow = new BpmnWorkflow
        {
            Name = request.Name,
            Description = request.Description,
            ProjectId = request.ProjectId,
            BpmnXml = request.BpmnXml ?? GenerateDefaultBpmnXml(request.Name),
            BpmnJson = request.BpmnJson ?? "{}",
            IsActive = true,
            Version = 1,
            OwnerId = userId
        };

        _context.BpmnWorkflows.Add(workflow);
        await _context.SaveChangesAsync();

        var result = new BpmnWorkflowDto
        {
            Id = workflow.Id,
            Name = workflow.Name,
            Description = workflow.Description,
            ProjectId = workflow.ProjectId,
            IsActive = workflow.IsActive,
            Version = workflow.Version,
            CreatedAt = workflow.CreatedAt,
            UpdatedAt = workflow.UpdatedAt
        };

        return CreatedAtAction(nameof(GetWorkflow), new { workflowId = workflow.Id }, result);
    }

    // PUT: api/bpmn/workflow/{workflowId}
    [HttpPut("workflow/{workflowId}")]
    public async Task<ActionResult<BpmnWorkflowDetailDto>> SaveWorkflow(int workflowId, [FromBody] SaveBpmnWorkflowRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var workflow = await _context.BpmnWorkflows
            .Include(w => w.Project)
            .FirstOrDefaultAsync(w => w.Id == workflowId && w.OwnerId == userId);
        
        if (workflow == null)
        {
            return NotFound("Workflow not found");
        }

        // update workflow
        workflow.Name = request.Name;
        workflow.Description = request.Description;
        workflow.BpmnXml = request.BpmnXml;
        workflow.BpmnJson = request.BpmnJson;
        workflow.UpdatedAt = DateTime.UtcNow;

        // remove existing elements and connections
        var existingElements = await _context.BpmnElements
            .Where(e => e.WorkflowId == workflowId)
            .ToListAsync();
        _context.BpmnElements.RemoveRange(existingElements);

        var existingConnections = await _context.BpmnConnections
            .Where(c => c.WorkflowId == workflowId)
            .ToListAsync();
        _context.BpmnConnections.RemoveRange(existingConnections);

        // add new elements
        var newElements = request.Elements.Select(e => new BpmnElement
        {
            ElementId = e.ElementId,
            ElementType = e.ElementType,
            Name = e.Name,
            Properties = e.Properties,
            WorkflowId = workflowId,
            X = e.X,
            Y = e.Y,
            Width = e.Width,
            Height = e.Height
        }).ToList();
        _context.BpmnElements.AddRange(newElements);

        // add new connections
        var newConnections = request.Connections.Select(c => new BpmnConnection
        {
            ConnectionId = c.ConnectionId,
            SourceElementId = c.SourceElementId,
            TargetElementId = c.TargetElementId,
            Name = c.Name,
            Condition = c.Condition,
            WorkflowId = workflowId,
            Waypoints = c.Waypoints
        }).ToList();
        _context.BpmnConnections.AddRange(newConnections);

        await _context.SaveChangesAsync();

        // return updated workflow
        return await GetWorkflow(workflowId);
    }

    // DELETE: api/bpmn/workflow/{workflowId}
    [HttpDelete("workflow/{workflowId}")]
    public async Task<IActionResult> DeleteWorkflow(int workflowId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var workflow = await _context.BpmnWorkflows
            .Include(w => w.Project)
            .FirstOrDefaultAsync(w => w.Id == workflowId && w.OwnerId == userId);
        
        if (workflow == null)
        {
            return NotFound("Workflow not found");
        }

        _context.BpmnWorkflows.Remove(workflow);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/bpmn/workflow/{workflowId}/activate
    [HttpPost("workflow/{workflowId}/activate")]
    public async Task<IActionResult> ActivateWorkflow(int workflowId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var workflow = await _context.BpmnWorkflows
            .Include(w => w.Project)
            .FirstOrDefaultAsync(w => w.Id == workflowId && w.OwnerId == userId);
        
        if (workflow == null)
        {
            return NotFound("Workflow not found");
        }

        // Deactivate other workflows in the same project
        var otherWorkflows = await _context.BpmnWorkflows
            .Where(w => w.ProjectId == workflow.ProjectId && w.Id != workflowId)
            .ToListAsync();

        foreach (var other in otherWorkflows)
        {
            other.IsActive = false;
        }

        workflow.IsActive = true;
        workflow.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // TODO: generate WorkflowStates and WorkflowTransitions from BPMN workflow

        return Ok();
    }

    // POST: api/bpmn/workflow/{workflowId}/assign/{projectId}
    [HttpPost("workflow/{workflowId}/assign/{projectId}")]
    public async Task<IActionResult> AssignWorkflowToProject(int workflowId, int projectId)
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

        // get the workflow to assign, check if user owns it
        var workflow = await _context.BpmnWorkflows
            .Include(w => w.Project)
            .FirstOrDefaultAsync(w => w.Id == workflowId && w.OwnerId == userId);
        
        if (workflow == null)
        {
            return NotFound("Workflow not found or access denied");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // find the currently active workflow for this project (if any)
            var currentActiveWorkflow = await _context.BpmnWorkflows
                .FirstOrDefaultAsync(w => w.ProjectId == projectId && w.IsActive);

            // if there's a currently active workflow, make it unassigned
            if (currentActiveWorkflow != null && currentActiveWorkflow.Id != workflowId)
            {
                currentActiveWorkflow.ProjectId = null;
                currentActiveWorkflow.IsActive = false;
                currentActiveWorkflow.UpdatedAt = DateTime.UtcNow;
            }

            // assign the new workflow to the project and make it active
            workflow.ProjectId = projectId;
            workflow.IsActive = true;
            workflow.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // GET: api/bpmn/workflows/all
    [HttpGet("workflows/all")]
    public async Task<ActionResult<IEnumerable<BpmnWorkflowDto>>> GetAllWorkflows()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // get all user projects
        var userProjectIds = await _context.Projects
            .Where(p => p.OwnerId == userId)
            .Select(p => p.Id)
            .ToListAsync();

        // get all workflows owned by the user (either assigned to user's projects or unassigned but owned by user)
        var workflows = await _context.BpmnWorkflows
            .Where(w => w.OwnerId == userId && (w.ProjectId == null || (w.ProjectId.HasValue && userProjectIds.Contains(w.ProjectId.Value))))
            .OrderBy(w => w.CreatedAt)
            .Select(w => new BpmnWorkflowDto
            {
                Id = w.Id,
                Name = w.Name,
                Description = w.Description,
                ProjectId = w.ProjectId,
                IsActive = w.IsActive,
                Version = w.Version,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt
            })
            .ToListAsync();

        return Ok(workflows);
    }

    // POST: api/bpmn/workflow/{workflowId}/copy/{projectId}
    [HttpPost("workflow/{workflowId}/copy/{projectId}")]
    public async Task<ActionResult<BpmnWorkflowDto>> CopyWorkflowToProject(int workflowId, int projectId)
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

        // get the source workflow - check if user owns it
        var sourceWorkflow = await _context.BpmnWorkflows
            .Include(w => w.Project)
            .FirstOrDefaultAsync(w => w.Id == workflowId && w.OwnerId == userId);
        
        if (sourceWorkflow == null)
        {
            return NotFound("Source workflow not found or access denied");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // deactivate current active workflow for this project
            var currentActiveWorkflow = await _context.BpmnWorkflows
                .FirstOrDefaultAsync(w => w.ProjectId == projectId && w.IsActive);

            if (currentActiveWorkflow != null)
            {
                currentActiveWorkflow.IsActive = false;
                currentActiveWorkflow.UpdatedAt = DateTime.UtcNow;
            }

            // create a copy of the workflow
            var copiedWorkflow = new BpmnWorkflow
            {
                Name = $"{sourceWorkflow.Name} (Copy)",
                Description = sourceWorkflow.Description,
                ProjectId = projectId,
                BpmnXml = sourceWorkflow.BpmnXml,
                BpmnJson = sourceWorkflow.BpmnJson,
                IsActive = true,
                Version = 1,
                ParentWorkflowId = sourceWorkflow.Id,
                OwnerId = userId
            };

            _context.BpmnWorkflows.Add(copiedWorkflow);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var result = new BpmnWorkflowDto
            {
                Id = copiedWorkflow.Id,
                Name = copiedWorkflow.Name,
                Description = copiedWorkflow.Description,
                ProjectId = copiedWorkflow.ProjectId,
                IsActive = copiedWorkflow.IsActive,
                Version = copiedWorkflow.Version,
                CreatedAt = copiedWorkflow.CreatedAt,
                UpdatedAt = copiedWorkflow.UpdatedAt
            };

            return Ok(result);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // POST: api/bpmn/workflow/{workflowId}/duplicate
    [HttpPost("workflow/{workflowId}/duplicate")]
    public async Task<ActionResult<BpmnWorkflowDto>> DuplicateWorkflow(int workflowId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // get the source workflow - check if user owns it
        var sourceWorkflow = await _context.BpmnWorkflows
            .Include(w => w.Project)
            .FirstOrDefaultAsync(w => w.Id == workflowId && w.OwnerId == userId);
        
        if (sourceWorkflow == null)
        {
            return NotFound("Source workflow not found or access denied");
        }

        // create a copy of the workflow (always unassigned)
        var duplicatedWorkflow = new BpmnWorkflow
        {
            Name = $"{sourceWorkflow.Name} (Copy)",
            Description = sourceWorkflow.Description,
            ProjectId = null, // always unassigned
            BpmnXml = sourceWorkflow.BpmnXml,
            BpmnJson = sourceWorkflow.BpmnJson,
            IsActive = false, // copies are not active by default
            Version = 1,
            OwnerId = userId
        };

        _context.BpmnWorkflows.Add(duplicatedWorkflow);
        await _context.SaveChangesAsync();

        var result = new BpmnWorkflowDto
        {
            Id = duplicatedWorkflow.Id,
            Name = duplicatedWorkflow.Name,
            Description = duplicatedWorkflow.Description,
            ProjectId = duplicatedWorkflow.ProjectId,
            IsActive = duplicatedWorkflow.IsActive,
            Version = duplicatedWorkflow.Version,
            CreatedAt = duplicatedWorkflow.CreatedAt,
            UpdatedAt = duplicatedWorkflow.UpdatedAt
        };

        return Ok(result);
    }

    private static string GenerateDefaultBpmnXml(string workflowName)
    {
        return $@"<?xml version=""1.0"" encoding=""UTF-8""?>
<bpmn:definitions xmlns:bpmn=""http://www.omg.org/spec/BPMN/20100524/MODEL"" 
                  xmlns:bpmndi=""http://www.omg.org/spec/BPMN/20100524/DI"" 
                  xmlns:dc=""http://www.omg.org/spec/DD/20100524/DC"" 
                  xmlns:di=""http://www.omg.org/spec/DD/20100524/DI""
                  id=""Definitions_1"" 
                  targetNamespace=""http://bpmn.io/schema/bpmn"">
  <bpmn:process id=""Process_1"" isExecutable=""true"">
    <bpmn:startEvent id=""StartEvent_1"" name=""Start"" />
    <bpmn:task id=""Task_1"" name=""Todo"" />
    <bpmn:task id=""Task_2"" name=""In Progress"" />
    <bpmn:task id=""Task_3"" name=""Review"" />
    <bpmn:endEvent id=""EndEvent_1"" name=""Done"" />
    <bpmn:sequenceFlow id=""Flow_1"" sourceRef=""StartEvent_1"" targetRef=""Task_1"" />
    <bpmn:sequenceFlow id=""Flow_2"" sourceRef=""Task_1"" targetRef=""Task_2"" />
    <bpmn:sequenceFlow id=""Flow_3"" sourceRef=""Task_2"" targetRef=""Task_3"" />
    <bpmn:sequenceFlow id=""Flow_4"" sourceRef=""Task_3"" targetRef=""EndEvent_1"" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id=""BPMNDiagram_1"">
    <bpmndi:BPMNPlane id=""BPMNPlane_1"" bpmnElement=""Process_1"">
      <bpmndi:BPMNShape id=""StartEvent_1_di"" bpmnElement=""StartEvent_1"">
        <dc:Bounds x=""152"" y=""102"" width=""36"" height=""36"" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id=""Task_1_di"" bpmnElement=""Task_1"">
        <dc:Bounds x=""240"" y=""80"" width=""100"" height=""80"" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id=""Task_2_di"" bpmnElement=""Task_2"">
        <dc:Bounds x=""390"" y=""80"" width=""100"" height=""80"" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id=""Task_3_di"" bpmnElement=""Task_3"">
        <dc:Bounds x=""540"" y=""80"" width=""100"" height=""80"" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id=""EndEvent_1_di"" bpmnElement=""EndEvent_1"">
        <dc:Bounds x=""692"" y=""102"" width=""36"" height=""36"" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>";
    }
}

// DTOs
public class BpmnWorkflowDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? ProjectId { get; set; }
    public bool IsActive { get; set; }
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class BpmnWorkflowDetailDto : BpmnWorkflowDto
{
    public string BpmnXml { get; set; } = string.Empty;
    public string BpmnJson { get; set; } = string.Empty;
    public List<BpmnElementDto> Elements { get; set; } = new();
    public List<BpmnConnectionDto> Connections { get; set; } = new();
}

public class BpmnElementDto
{
    public int Id { get; set; }
    public string ElementId { get; set; } = string.Empty;
    public string ElementType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Properties { get; set; } = "{}";
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}

public class BpmnConnectionDto
{
    public int Id { get; set; }
    public string ConnectionId { get; set; } = string.Empty;
    public string SourceElementId { get; set; } = string.Empty;
    public string TargetElementId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public string Waypoints { get; set; } = "[]";
}

// Requests
public class CreateBpmnWorkflowRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? ProjectId { get; set; }
    public string? BpmnXml { get; set; }
    public string? BpmnJson { get; set; }
}

public class SaveBpmnWorkflowRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string BpmnXml { get; set; } = string.Empty;
    public string BpmnJson { get; set; } = string.Empty;
    public List<BpmnElementDto> Elements { get; set; } = new();
    public List<BpmnConnectionDto> Connections { get; set; } = new();
}
