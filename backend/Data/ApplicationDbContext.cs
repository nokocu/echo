using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class ApplicationDbContext : IdentityDbContext<User>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Project> Projects { get; set; }
    public DbSet<TaskItem> Tasks { get; set; }
    public DbSet<WorkflowState> WorkflowStates { get; set; }
    public DbSet<WorkflowTransition> WorkflowTransitions { get; set; }
    public DbSet<WorkflowAuditEntry> WorkflowAuditEntries { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // configure relationships
        builder.Entity<TaskItem>()
            .HasOne(t => t.Project)
            .WithMany(p => p.Tasks)
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TaskItem>()
            .HasOne(t => t.Assignee)
            .WithMany(u => u.AssignedTasks)
            .HasForeignKey(t => t.AssigneeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<TaskItem>()
            .HasOne(t => t.WorkflowState)
            .WithMany(w => w.Tasks)
            .HasForeignKey(t => t.WorkflowStateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Project>()
            .HasOne(p => p.Owner)
            .WithMany(u => u.Projects)
            .HasForeignKey(p => p.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<WorkflowState>()
            .HasOne(w => w.Project)
            .WithMany(p => p.WorkflowStates)
            .HasForeignKey(w => w.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<WorkflowTransition>()
            .HasOne(wt => wt.FromState)
            .WithMany(w => w.FromTransitions)
            .HasForeignKey(wt => wt.FromStateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<WorkflowTransition>()
            .HasOne(wt => wt.ToState)
            .WithMany(w => w.ToTransitions)
            .HasForeignKey(wt => wt.ToStateId)
            .OnDelete(DeleteBehavior.NoAction);

        // workflow audit entry relationships
        builder.Entity<WorkflowAuditEntry>()
            .HasOne(wa => wa.Task)
            .WithMany()
            .HasForeignKey(wa => wa.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<WorkflowAuditEntry>()
            .HasOne(wa => wa.FromState)
            .WithMany()
            .HasForeignKey(wa => wa.FromStateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<WorkflowAuditEntry>()
            .HasOne(wa => wa.ToState)
            .WithMany()
            .HasForeignKey(wa => wa.ToStateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<WorkflowAuditEntry>()
            .HasOne(wa => wa.User)
            .WithMany()
            .HasForeignKey(wa => wa.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // seed default workflow states
        // SeedDefaultWorkflowStates(builder);
    }

    private static void SeedDefaultWorkflowStates(ModelBuilder builder)
    {
    }
}
