namespace CollabEditor.API.Models.Entities
{
    public class Friendship
    {
        public Guid Id { get; set; }
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }

        public string Status { get; set; } = null!;

        public DateTime CreatedAt { get; set; }
        public User Sender { get; set; } = null!;
        public User Receiver { get; set; } = null!;
       

       
    }
}
