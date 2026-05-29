namespace CollabEditor.API.Models.DTOs
{
    public class JoinDocumentResponse
    {
        public Guid DocumentId { get; set; }
        public string DocumentTitle { get; set; } = null!;
        public string Role { get; set; } = null!;
    }
}