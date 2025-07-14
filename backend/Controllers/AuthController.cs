using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Models;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IConfiguration configuration,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        // Create default project and workflow states for new user
        await CreateDefaultProjectForUser(user.Id);

        var token = await GenerateJwtToken(user);
        return Ok(new AuthResponse
        {
            Token = token,
            User = new UserResponse
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName
            }
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return BadRequest("Invalid email or password");

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded)
            return BadRequest("Invalid email or password");

        var token = await GenerateJwtToken(user);
        return Ok(new AuthResponse
        {
            Token = token,
            User = new UserResponse
            {
                Id = user.Id,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName
            }
        });
    }

    private async Task<string> GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]!;
        
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
        };

        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpiryMinutes"]!)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task CreateDefaultProjectForUser(string userId)
    {
        // Create default project
        var project = new Project
        {
            Name = "My First Project",
            Description = "Default project for getting started with task management",
            OwnerId = userId
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        // Create default workflow states
        var workflowStates = new[]
        {
            new WorkflowState
            {
                Name = "Todo",
                Color = "#6B7280",
                Type = WorkflowStateType.Start,
                Order = 1,
                ProjectId = project.Id
            },
            new WorkflowState
            {
                Name = "In Progress",
                Color = "#3B82F6",
                Type = WorkflowStateType.InProgress,
                Order = 2,
                ProjectId = project.Id
            },
            new WorkflowState
            {
                Name = "Review",
                Color = "#F59E0B",
                Type = WorkflowStateType.Review,
                Order = 3,
                ProjectId = project.Id
            },
            new WorkflowState
            {
                Name = "Done",
                Color = "#10B981",
                Type = WorkflowStateType.Completed,
                Order = 4,
                ProjectId = project.Id
            }
        };

        _context.WorkflowStates.AddRange(workflowStates);
        await _context.SaveChangesAsync();

        // create default workflow transitions
        var transitions = new[]
        {
            new WorkflowTransition
            {
                Name = "Start Progress",
                FromStateId = workflowStates[0].Id, // Todo
                ToStateId = workflowStates[1].Id,   // In Progress
                Order = 1,
                IsAutomatic = false
            },
            new WorkflowTransition
            {
                Name = "Send for Review",
                FromStateId = workflowStates[1].Id, // In Progress
                ToStateId = workflowStates[2].Id,   // Review
                Order = 2,
                IsAutomatic = false
            },
            new WorkflowTransition
            {
                Name = "Complete Task",
                FromStateId = workflowStates[2].Id, // Review
                ToStateId = workflowStates[3].Id,   // Done
                Order = 3,
                IsAutomatic = false
            },
            new WorkflowTransition
            {
                Name = "Back to Todo",
                FromStateId = workflowStates[2].Id, // Review
                ToStateId = workflowStates[0].Id,   // Todo
                Order = 4,
                IsAutomatic = false
            },
            new WorkflowTransition
            {
                Name = "Back to Progress",
                FromStateId = workflowStates[2].Id, // Review
                ToStateId = workflowStates[1].Id,   // In Progress
                Order = 5,
                IsAutomatic = false
            },
            new WorkflowTransition
            {
                Name = "Reopen Task",
                FromStateId = workflowStates[3].Id, // Done
                ToStateId = workflowStates[0].Id,   // Todo
                Order = 6,
                IsAutomatic = false
            }
        };

        _context.WorkflowTransitions.AddRange(transitions);
        await _context.SaveChangesAsync();
    }
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserResponse User { get; set; } = null!;
}

public class UserResponse
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}
