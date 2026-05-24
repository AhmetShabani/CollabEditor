namespace CollabEditor.API.Models.DTOs
{
    public class DocumentResponse
    {

        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string? Content { get; set; }
        public Guid OwnerId { get; set; }
        public string OwnerUsername{ get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string Language { get; set; } = null!;

    }
}
