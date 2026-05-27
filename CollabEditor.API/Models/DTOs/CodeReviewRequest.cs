namespace CollabEditor.API.Models.DTOs
{
    public class CodeReviewRequest
    {
        public string Code { get; set; } = null!;
        public string Language { get; set; } = null!;
    }
}
