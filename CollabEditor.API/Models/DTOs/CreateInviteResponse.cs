namespace CollabEditor.API.Models.DTOs
{
    public class CreateInviteResponse
    {
        public string Token { get; set; } = null!;
        public string InviteLink { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
    }
}