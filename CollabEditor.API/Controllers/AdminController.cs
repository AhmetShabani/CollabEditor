using CollabEditor.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CollabEditor.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var result = await _adminService.GetAllUsersAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(Guid userId)
        {
            try
            {
                await _adminService.DeleteUserAsync(userId);
                return Ok(new { message = "User deleted" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("users/{userId}/role")]
        public async Task<IActionResult> ChangeUserRole(Guid userId, [FromBody] string role)
        {
            try
            {
                await _adminService.ChangeUserRoleAsync(userId, role);
                return Ok(new { message = "Role updated" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("documents")]
        public async Task<IActionResult> GetAllDocuments()
        {
            try
            {
                var result = await _adminService.GetAllDocumentsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("documents/{documentId}")]
        public async Task<IActionResult> DeleteDocument(Guid documentId)
        {
            try
            {
                await _adminService.DeleteDocumentAsync(documentId);
                return Ok(new { message = "Document deleted" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var result = await _adminService.GetStatisticsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}