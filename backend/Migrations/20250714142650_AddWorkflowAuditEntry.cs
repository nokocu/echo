using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowAuditEntry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConditionExpression",
                table: "WorkflowTransitions",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAutomatic",
                table: "WorkflowTransitions",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "WorkflowTransitions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "WorkflowAuditEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TaskId = table.Column<int>(type: "INTEGER", nullable: false),
                    FromStateId = table.Column<int>(type: "INTEGER", nullable: false),
                    ToStateId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    Comment = table.Column<string>(type: "TEXT", nullable: true),
                    TransitionedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SystemInfo = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowAuditEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowAuditEntries_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowAuditEntries_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkflowAuditEntries_WorkflowStates_FromStateId",
                        column: x => x.FromStateId,
                        principalTable: "WorkflowStates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowAuditEntries_WorkflowStates_ToStateId",
                        column: x => x.ToStateId,
                        principalTable: "WorkflowStates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowAuditEntries_FromStateId",
                table: "WorkflowAuditEntries",
                column: "FromStateId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowAuditEntries_TaskId",
                table: "WorkflowAuditEntries",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowAuditEntries_ToStateId",
                table: "WorkflowAuditEntries",
                column: "ToStateId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowAuditEntries_UserId",
                table: "WorkflowAuditEntries",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkflowAuditEntries");

            migrationBuilder.DropColumn(
                name: "ConditionExpression",
                table: "WorkflowTransitions");

            migrationBuilder.DropColumn(
                name: "IsAutomatic",
                table: "WorkflowTransitions");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "WorkflowTransitions");
        }
    }
}
