namespace CollabEditor.API.Models.DTOs
{
    public class AuthResponse
    {
        public Guid Id { get; set; }
        public string Token { get; set; } = null!;
        public string RefreshToken { get; set; } = null!;
        public string Username { get; set; } = null!;   
        public string Role { get; set; } = null!;
    }
}
