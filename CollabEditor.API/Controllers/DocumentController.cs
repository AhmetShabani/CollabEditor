using CollabEditor.API.Models.DTOs;
using CollabEditor.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CollabEditor.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DocumentController : ControllerBase
    {
        private readonly IDocumentService _documentService;
        public DocumentController(IDocumentService documentService)
        {
            _documentService = documentService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDocumentRequest request)
        {
    
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _documentService.CreateAsync(request, userId);
                return Ok(result);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _documentService.GetAllAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _documentService.GetByIdAsync(id,userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDocumentRequest request)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _documentService.UpdateAsync(id, userId,request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _documentService.DeleteAsync(id, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}/chat")]
        public async Task<IActionResult> GetChatHistory(Guid id)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var messages = await _documentService.GetChatHistoryAsync(id, userId);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}/chat")]
        public async Task<IActionResult> ClearChat(Guid id)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                await _documentService.ClearChatAsync(id, userId);
                return Ok(new { message = "Chat cleared" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/invite")]
        public async Task<IActionResult> CreateInvite(Guid id)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _documentService.CreateInviteAsync(id, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("join/{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> JoinByInvite(string token)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _documentService.JoinByInviteAsync(token, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}/collaborators")]
        public async Task<IActionResult> GetCollaborators(Guid id)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                var result = await _documentService.GetCollaboratorsAsync(id, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}/collaborators/{collaboratorUserId}")]
        public async Task<IActionResult> RemoveCollaborator(Guid id, Guid collaboratorUserId)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                await _documentService.RemoveCollaboratorAsync(id, collaboratorUserId, userId);
                return Ok(new { message = "Collaborator removed" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
