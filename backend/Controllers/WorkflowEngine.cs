using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
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

            var fromStateId = task.WorkflowStateId;
            task.WorkflowStateId = toStateId;

            // Create audit entry
            var auditEntry = new WorkflowAuditEntry
            {
                TaskId = taskId,
                FromStateId = fromStateId,
                ToStateId = toStateId,
                UserId = userId,
                Comment = comment,
                TransitionedAt = DateTime.UtcNow
            };

            _context.WorkflowAuditEntries.Add(auditEntry);

            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<List<WorkflowAuditEntry>> GetTaskAuditHistoryAsync(int taskId)
        {
            return await _context.WorkflowAuditEntries
                .Where(entry => entry.TaskId == taskId)
                .OrderBy(entry => entry.TransitionedAt)
                .ToListAsync();
        }
    }
}
