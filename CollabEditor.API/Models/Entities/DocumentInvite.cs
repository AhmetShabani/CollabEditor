namespace CollabEditor.API.Models.Entities
{
    public class DocumentInvite
    {
        public Guid Id { get; set; }
        public Guid DocumentId { get; set; }
        public Document Document { get; set; } = null!;
        public string Token { get; set; } = null!;

        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }

        public Guid CreatedByUserId { get; set; }   
    }
}
