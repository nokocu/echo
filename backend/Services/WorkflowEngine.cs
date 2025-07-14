using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

// workflow execution context for rule evaluation
public class WorkflowContext
{
    public TaskItem Task { get; set; } = null!;
    public User User { get; set; } = null!;
    public Project Project { get; set; } = null!;
    public DateTime ExecutionTime { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> Variables { get; set; } = new();
}

// strategy pattern for transition conditions
public interface ITransitionCondition
{
    Task<bool> EvaluateAsync(WorkflowContext context);
    string ConditionType { get; }
}

// time-based transition condition
public class TimeBasedCondition : ITransitionCondition
{
    public string ConditionType => "TimeBased";
    private readonly TimeSpan _delay;
    private readonly string _fromDateField;

    public TimeBasedCondition(TimeSpan delay, string fromDateField = "CreatedAt")
    {
        _delay = delay;
        _fromDateField = fromDateField;
    }

    public Task<bool> EvaluateAsync(WorkflowContext context)
    {
        var referenceDate = _fromDateField switch
        {
            "CreatedAt" => context.Task.CreatedAt,
            "UpdatedAt" => context.Task.UpdatedAt,
            "DueDate" => context.Task.DueDate ?? DateTime.UtcNow,
            _ => context.Task.CreatedAt
        };

        var isReady = DateTime.UtcNow >= referenceDate.Add(_delay);
        return Task.FromResult(isReady);
    }
}

// priority-based condition
public class PriorityCondition : ITransitionCondition
{
    public string ConditionType => "Priority";
    private readonly TaskPriority _requiredPriority;

    public PriorityCondition(TaskPriority requiredPriority)
    {
        _requiredPriority = requiredPriority;
    }

    public Task<bool> EvaluateAsync(WorkflowContext context)
    {
        var meetsCondition = context.Task.Priority >= _requiredPriority;
        return Task.FromResult(meetsCondition);
    }
}

// assignment-based condition
public class AssignmentCondition : ITransitionCondition
{
    public string ConditionType => "Assignment";
    private readonly bool _requiresAssignment;

    public AssignmentCondition(bool requiresAssignment = true)
    {
        _requiresAssignment = requiresAssignment;
    }

    public Task<bool> EvaluateAsync(WorkflowContext context)
    {
        var hasAssignee = !string.IsNullOrEmpty(context.Task.AssigneeId);
        var meetsCondition = _requiresAssignment ? hasAssignee : !hasAssignee;
        return Task.FromResult(meetsCondition);
    }
}

// main workflow engine with advanced c# patterns
public interface IWorkflowEngine
{
    Task<bool> CanTransitionAsync(int taskId, int targetStateId, string userId);
    Task<WorkflowTransitionResult> TransitionAsync(int taskId, int targetStateId, string userId, string? comment = null);
    Task<IEnumerable<WorkflowState>> GetAvailableTransitionsAsync(int taskId, string userId);
    Task ProcessAutomaticTransitionsAsync();
}

public class WorkflowTransitionResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public WorkflowState? NewState { get; set; }
    public TaskItem? UpdatedTask { get; set; }
}

public class WorkflowEngine : IWorkflowEngine
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkflowEngine> _logger;
    private readonly Dictionary<string, ITransitionCondition> _conditions;

    public WorkflowEngine(ApplicationDbContext context, ILogger<WorkflowEngine> logger)
    {
        _context = context;
        _logger = logger;
        _conditions = new Dictionary<string, ITransitionCondition>();
        
        // register built-in conditions
        RegisterCondition("auto_progress_24h", new TimeBasedCondition(TimeSpan.FromHours(24)));
        RegisterCondition("high_priority_only", new PriorityCondition(TaskPriority.High));
        RegisterCondition("requires_assignment", new AssignmentCondition(true));
    }

    public void RegisterCondition(string name, ITransitionCondition condition)
    {
        _conditions[name] = condition;
    }

    public async Task<bool> CanTransitionAsync(int taskId, int targetStateId, string userId)
    {
        var context = await BuildWorkflowContextAsync(taskId, userId);
        if (context == null) return false;

        var transition = await GetValidTransitionAsync(context.Task.WorkflowStateId, targetStateId);
        if (transition == null) return false;

        return await EvaluateTransitionConditionsAsync(transition, context);
    }

    public async Task<WorkflowTransitionResult> TransitionAsync(int taskId, int targetStateId, string userId, string? comment = null)
    {
        try
        {
            var context = await BuildWorkflowContextAsync(taskId, userId);
            if (context == null)
            {
                return new WorkflowTransitionResult 
                { 
                    Success = false, 
                    ErrorMessage = "Task not found or access denied" 
                };
            }

            var transition = await GetValidTransitionAsync(context.Task.WorkflowStateId, targetStateId);
            if (transition == null)
            {
                return new WorkflowTransitionResult 
                { 
                    Success = false, 
                    ErrorMessage = "Invalid transition" 
                };
            }

            var canTransition = await EvaluateTransitionConditionsAsync(transition, context);
            if (!canTransition)
            {
                return new WorkflowTransitionResult 
                { 
                    Success = false, 
                    ErrorMessage = "Transition conditions not met" 
                };
            }

            // execute the transition
            var newState = await _context.WorkflowStates.FindAsync(targetStateId);
            if (newState == null)
            {
                return new WorkflowTransitionResult 
                { 
                    Success = false, 
                    ErrorMessage = "Target state not found" 
                };
            }

            // capture original state before update
            var originalStateId = context.Task.WorkflowStateId;

            // update task state
            context.Task.WorkflowStateId = targetStateId;
            context.Task.UpdatedAt = DateTime.UtcNow;

            // handle completion
            if (newState.Type == WorkflowStateType.Completed)
            {
                context.Task.CompletedAt = DateTime.UtcNow;
            }
            else if (context.Task.CompletedAt.HasValue)
            {
                context.Task.CompletedAt = null;
            }

            // create audit trail
            var auditEntry = new WorkflowAuditEntry
            {
                TaskId = taskId,
                FromStateId = originalStateId,  // use original state, not current
                ToStateId = targetStateId,
                UserId = userId,
                Comment = comment,
                TransitionedAt = DateTime.UtcNow
            };

            _context.WorkflowAuditEntries.Add(auditEntry);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "workflow transition completed: task {TaskId} from state {FromState} to {ToState} by user {UserId}",
                taskId, context.Task.WorkflowStateId, targetStateId, userId);

            return new WorkflowTransitionResult
            {
                Success = true,
                NewState = newState,
                UpdatedTask = context.Task
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "error during workflow transition for task {TaskId}", taskId);
            return new WorkflowTransitionResult 
            { 
                Success = false, 
                ErrorMessage = "Internal error during transition" 
            };
        }
    }

    public async Task<IEnumerable<WorkflowState>> GetAvailableTransitionsAsync(int taskId, string userId)
    {
        var context = await BuildWorkflowContextAsync(taskId, userId);
        if (context == null) return Enumerable.Empty<WorkflowState>();

        var transitions = await _context.WorkflowTransitions
            .Include(t => t.ToState)
            .Where(t => t.FromStateId == context.Task.WorkflowStateId)
            .ToListAsync();

        var availableStates = new List<WorkflowState>();

        foreach (var transition in transitions)
        {
            var canTransition = await EvaluateTransitionConditionsAsync(transition, context);
            if (canTransition)
            {
                availableStates.Add(transition.ToState);
            }
        }

        return availableStates;
    }

    public async Task ProcessAutomaticTransitionsAsync()
    {
        // find tasks that might need automatic transitions
        var tasks = await _context.Tasks
            .Include(t => t.WorkflowState)
            .Include(t => t.Project)
            .ThenInclude(p => p.Owner)
            .Where(t => t.WorkflowState.Type == WorkflowStateType.InProgress || t.WorkflowState.Type == WorkflowStateType.Start)
            .ToListAsync();

        await ProcessTasksForAutomaticTransitions(tasks);
    }

    public async Task<List<TaskItem>> ProcessAutomaticTransitionsAsync(int projectId)
    {
        // find tasks for specific project that might need automatic transitions
        var projectTasks = await _context.Tasks
            .Include(t => t.WorkflowState)
            .Include(t => t.Project)
            .ThenInclude(p => p.Owner)
            .Where(t => t.ProjectId == projectId && 
                   (t.WorkflowState.Type == WorkflowStateType.InProgress || t.WorkflowState.Type == WorkflowStateType.Start))
            .ToListAsync();

        await ProcessTasksForAutomaticTransitions(projectTasks);
        return projectTasks;
    }

    private async Task ProcessTasksForAutomaticTransitions(List<TaskItem> tasks)
    {
        foreach (var task in tasks)
        {
            try
            {
                var context = new WorkflowContext
                {
                    Task = task,
                    User = task.Project.Owner,
                    Project = task.Project,
                    ExecutionTime = DateTime.UtcNow
                };

                var transitions = await _context.WorkflowTransitions
                    .Where(t => t.FromStateId == task.WorkflowStateId && t.IsAutomatic)
                    .ToListAsync();

                foreach (var transition in transitions)
                {
                    var canTransition = await EvaluateTransitionConditionsAsync(transition, context);
                    if (canTransition)
                    {
                        _logger.LogInformation(
                            "executing automatic transition for task {TaskId} to state {ToStateId}",
                            task.Id, transition.ToStateId);

                        await TransitionAsync(task.Id, transition.ToStateId, task.Project.OwnerId, "Automatic transition");
                        break; // only execute first valid transition
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "error processing automatic transition for task {TaskId}", task.Id);
            }
        }
    }

    private async Task<WorkflowContext?> BuildWorkflowContextAsync(int taskId, string userId)
    {
        var task = await _context.Tasks
            .Include(t => t.Project)
            .ThenInclude(p => p.Owner)
            .Include(t => t.WorkflowState)
            .FirstOrDefaultAsync(t => t.Id == taskId && (t.Project.OwnerId == userId || t.AssigneeId == userId));

        if (task == null) return null;

        return new WorkflowContext
        {
            Task = task,
            User = task.Project.Owner,
            Project = task.Project,
            ExecutionTime = DateTime.UtcNow
        };
    }

    private async Task<WorkflowTransition?> GetValidTransitionAsync(int fromStateId, int toStateId)
    {
        return await _context.WorkflowTransitions
            .FirstOrDefaultAsync(t => t.FromStateId == fromStateId && t.ToStateId == toStateId);
    }

    private async Task<bool> EvaluateTransitionConditionsAsync(WorkflowTransition transition, WorkflowContext context)
    {
        if (string.IsNullOrEmpty(transition.ConditionExpression))
            return true;

        // parse and evaluate conditions
        var conditionNames = transition.ConditionExpression.Split(',', StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var conditionName in conditionNames)
        {
            var trimmedName = conditionName.Trim();
            if (_conditions.TryGetValue(trimmedName, out var condition))
            {
                var result = await condition.EvaluateAsync(context);
                if (!result)
                {
                    _logger.LogDebug("Condition {ConditionName} failed for task {TaskId}", trimmedName, context.Task.Id);
                    return false;
                }
            }
        }

        return true;
    }
}
