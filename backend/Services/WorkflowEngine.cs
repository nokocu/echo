using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class WorkflowEngine
    {
        private readonly ApplicationDbContext _context;

        public WorkflowEngine(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> TransitionTaskAsync(int taskId, int toStateId, string userId, string? comment = null)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null) return false;

            var toState = await _context.WorkflowStates.FindAsync(toStateId);
            if (toState == null) return false;

            var fromState = await _context.WorkflowStates.FindAsync(task.WorkflowStateId);
            
            if (toState.ProjectId != fromState?.ProjectId) return false;

            task.WorkflowStateId = toStateId;
            task.UpdatedAt = DateTime.UtcNow;

            var auditEntry = new WorkflowAuditEntry
            {
                TaskId = taskId,
                FromStateId = fromState.Id,
                ToStateId = toStateId,
                UserId = userId,
                Comment = comment,
                TransitionedAt = DateTime.UtcNow,
                SystemInfo = "Manual transition"
            };

            _context.WorkflowAuditEntries.Add(auditEntry);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
