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

        // seed default workflow states
        SeedDefaultWorkflowStates(builder);
    }

    private static void SeedDefaultWorkflowStates(ModelBuilder builder)
    {
        // these will be template states that projects can copy
        builder.Entity<WorkflowState>().HasData(
            new WorkflowState
            {
                Id = -1,
                Name = "Todo",
                Description = "Tasks that are ready to be worked on",
                Type = WorkflowStateType.Start,
                Order = 1,
                Color = "#6B7280",
                ProjectId = -1 // template project
            },
            new WorkflowState
            {
                Id = -2,
                Name = "In Progress",
                Description = "Tasks currently being worked on",
                Type = WorkflowStateType.InProgress,
                Order = 2,
                Color = "#3B82F6",
                ProjectId = -1
            },
            new WorkflowState
            {
                Id = -3,
                Name = "Review",
                Description = "Tasks waiting for review or approval",
                Type = WorkflowStateType.Review,
                Order = 3,
                Color = "#F59E0B",
                ProjectId = -1
            },
            new WorkflowState
            {
                Id = -4,
                Name = "Done",
                Description = "Completed tasks",
                Type = WorkflowStateType.Completed,
                Order = 4,
                Color = "#10B981",
                ProjectId = -1
            }
        );
    }
}
