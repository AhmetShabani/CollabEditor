namespace CollabEditor.API.Models.Entities
{
    public class ChatMessage
    {
        public Guid Id { get; set; }
        public Guid DocumentId { get; set; }
        public Document Document { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string Message { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }
}
