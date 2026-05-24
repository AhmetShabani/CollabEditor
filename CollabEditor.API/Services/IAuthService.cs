using CollabEditor.API.Models.DTOs;
namespace CollabEditor.API.Services

{
    public interface IAuthService
    {
       Task<AuthResponse> RegisterAsync(string username, string email, string password);

        Task<AuthResponse> LoginAsync(string email, string password);


        Task<AuthResponse> RefreshTokenAsync(string refreshToken);
      
    }
}
