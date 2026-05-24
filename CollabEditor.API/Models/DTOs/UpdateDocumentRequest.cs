namespace CollabEditor.API.Models.DTOs
{
    public class UpdateDocumentRequest
    {
        public string Title { get; set; } = null!;
        public string? Content { get; set; }

        public string Language { get; set; } = null!;
    }
}
