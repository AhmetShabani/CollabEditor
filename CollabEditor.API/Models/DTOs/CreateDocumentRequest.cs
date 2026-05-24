namespace CollabEditor.API.Models.DTOs
{
    public class CreateDocumentRequest
    {
        public string Title { get; set; } = null!;
        public string? Content { get; set; }

        public string Language { get; set; } = null!;
    }
}
