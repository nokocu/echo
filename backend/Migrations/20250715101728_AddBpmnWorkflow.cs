using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddBpmnWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BpmnWorkflows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    BpmnXml = table.Column<string>(type: "TEXT", nullable: false),
                    BpmnJson = table.Column<string>(type: "TEXT", nullable: false),
                    ProjectId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false),
                    ParentWorkflowId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BpmnWorkflows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BpmnWorkflows_BpmnWorkflows_ParentWorkflowId",
                        column: x => x.ParentWorkflowId,
                        principalTable: "BpmnWorkflows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BpmnWorkflows_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BpmnConnections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ConnectionId = table.Column<string>(type: "TEXT", nullable: false),
                    SourceElementId = table.Column<string>(type: "TEXT", nullable: false),
                    TargetElementId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Condition = table.Column<string>(type: "TEXT", nullable: false),
                    WorkflowId = table.Column<int>(type: "INTEGER", nullable: false),
                    Waypoints = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BpmnConnections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BpmnConnections_BpmnWorkflows_WorkflowId",
                        column: x => x.WorkflowId,
                        principalTable: "BpmnWorkflows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BpmnElements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ElementId = table.Column<string>(type: "TEXT", nullable: false),
                    ElementType = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Properties = table.Column<string>(type: "TEXT", nullable: false),
                    WorkflowId = table.Column<int>(type: "INTEGER", nullable: false),
                    X = table.Column<double>(type: "REAL", nullable: false),
                    Y = table.Column<double>(type: "REAL", nullable: false),
                    Width = table.Column<double>(type: "REAL", nullable: false),
                    Height = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BpmnElements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BpmnElements_BpmnWorkflows_WorkflowId",
                        column: x => x.WorkflowId,
                        principalTable: "BpmnWorkflows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BpmnConnections_SourceElementId",
                table: "BpmnConnections",
                column: "SourceElementId");

            migrationBuilder.CreateIndex(
                name: "IX_BpmnConnections_TargetElementId",
                table: "BpmnConnections",
                column: "TargetElementId");

            migrationBuilder.CreateIndex(
                name: "IX_BpmnConnections_WorkflowId",
                table: "BpmnConnections",
                column: "WorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_BpmnElements_ElementId",
                table: "BpmnElements",
                column: "ElementId");

            migrationBuilder.CreateIndex(
                name: "IX_BpmnElements_WorkflowId",
                table: "BpmnElements",
                column: "WorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_BpmnWorkflows_ParentWorkflowId",
                table: "BpmnWorkflows",
                column: "ParentWorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_BpmnWorkflows_ProjectId",
                table: "BpmnWorkflows",
                column: "ProjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BpmnConnections");

            migrationBuilder.DropTable(
                name: "BpmnElements");

            migrationBuilder.DropTable(
                name: "BpmnWorkflows");
        }
    }
}
