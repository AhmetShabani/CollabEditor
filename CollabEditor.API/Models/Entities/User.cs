namespace CollabEditor.API.Models.Entities
{
    public class User
    {
        public Guid Id { get; set; } 
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string Role { get; set; } = null!;
        public DateTime CreatedAt { get; set; } 
        public string? RefreshToken {  get; set; } 
        public DateTime RefreshTokenExpiry { get; set; }
    }
}
