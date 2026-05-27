using CollabEditor.API.Models.DTOs;
using CollabEditor.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollabEditor.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly IAIService _aiService;
        public AIController(IAIService aiService)
        {
            _aiService = aiService;
        }
        [HttpPost("review")]
        public async Task<IActionResult> Review([FromBody] CodeReviewRequest request)
        {
            try
            {
                var result = await _aiService.ReviewCodeAsync(request.Code, request.Language);
                return Ok(new { review = result });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


    }
}
