using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OwnerId",
                table: "BpmnWorkflows",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_BpmnWorkflows_OwnerId",
                table: "BpmnWorkflows",
                column: "OwnerId");

            migrationBuilder.AddForeignKey(
                name: "FK_BpmnWorkflows_AspNetUsers_OwnerId",
                table: "BpmnWorkflows",
                column: "OwnerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BpmnWorkflows_AspNetUsers_OwnerId",
                table: "BpmnWorkflows");

            migrationBuilder.DropIndex(
                name: "IX_BpmnWorkflows_OwnerId",
                table: "BpmnWorkflows");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "BpmnWorkflows");
        }
    }
}
