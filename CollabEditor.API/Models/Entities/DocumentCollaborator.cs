namespace CollabEditor.API.Models.Entities
{
    public class DocumentCollaborator
    {
        public Guid UserId { get; set; } 
        public Guid DocumentId { get; set; }

        public Document Document { get; set; } = null!;
        public User User { get; set; } = null!;
        public string Role { get; set; } = null!;
        public DateTime JoinedAt { get; set; }
    }
}
