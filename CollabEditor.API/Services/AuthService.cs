using CollabEditor.API.Data;
using CollabEditor.API.Models;
using CollabEditor.API.Models.DTOs;
using CollabEditor.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace CollabEditor.API.Services

{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly JwtSettings _jwtSettings;
        public AuthService(AppDbContext context, IOptions<JwtSettings> jwtSettings)
        {
            _context = context;
            _jwtSettings = jwtSettings.Value;
        }
        public async Task<AuthResponse> RegisterAsync(string username, string email, string password)
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(x => x.Email == email);
            if (existingUser != null)
            {
                throw new Exception("Email already exists");
            }
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = username,
                Email = email,
                PasswordHash = passwordHash,
                Role = "User",
                CreatedAt = DateTime.UtcNow
            };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            var token = GenerateJwtToken(user);
            var newRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();
            return new AuthResponse
            {
                Token = token,
                RefreshToken = newRefreshToken,
                Username = user.Username,
                Role = user.Role
            };

        }
        public async Task<AuthResponse> LoginAsync(string email, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email);
            if (user == null)
            {
                throw new Exception("User not found");
            }
            bool isValid = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
            if (!isValid)
            {
                throw new Exception("Wrong password");
            }
            var token = GenerateJwtToken(user);
            var newRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();
            return new AuthResponse
            {
                Token = token,
                RefreshToken = newRefreshToken,
                Username = user.Username,
                Role = user.Role,
                Id = user.Id
            };


        }

        public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
        {
            var user = await _context.Users.FirstOrDefaultAsync(x => x.RefreshToken == refreshToken);
            if (user == null) throw new Exception("Invalid refresh token");

            if (user.RefreshTokenExpiry < DateTime.UtcNow)
            {
                throw new Exception("Refresh token expired");
            }
            var token = GenerateJwtToken(user);

            var newRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

            await _context.SaveChangesAsync();
            return new AuthResponse
            {
                Token = token,
                RefreshToken = newRefreshToken,
                Username = user.Username,
                Role = user.Role
            };


        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));

            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
