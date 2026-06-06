using CollabEditor.API.Data;
using Microsoft.EntityFrameworkCore;

namespace CollabEditor.API.Services
{
    public class AdminService : IAdminService
    {
        private readonly AppDbContext _context;

        public AdminService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<object>> GetAllUsersAsync()
        {
            return await _context.Users
                .Select(u => new
                {
                    id = u.Id,
                    username = u.Username,
                    email = u.Email,
                    role = u.Role,
                    createdAt = u.CreatedAt
                })
                .ToListAsync();
        }

        public async Task DeleteUserAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new Exception("User not found");

            // Delete related data
            var friendships = _context.Friendships
                .Where(f => f.SenderId == userId || f.ReceiverId == userId);
            _context.Friendships.RemoveRange(friendships);

            var notifications = _context.Notifications
                .Where(n => n.UserId == userId);
            _context.Notifications.RemoveRange(notifications);

            var collaborations = _context.DocumentCollaborators
                .Where(dc => dc.UserId == userId);
            _context.DocumentCollaborators.RemoveRange(collaborations);

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }

        public async Task ChangeUserRoleAsync(Guid userId, string role)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new Exception("User not found");

            user.Role = role;
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<object>> GetAllDocumentsAsync()
        {
            return await _context.Documents
                .Include(d => d.Owner)
                .Select(d => new
                {
                    id = d.Id,
                    title = d.Title,
                    language = d.Language,
                    ownerUsername = d.Owner.Username,
                    createdAt = d.CreatedAt,
                    updatedAt = d.UpdatedAt
                })
                .ToListAsync();
        }

        public async Task DeleteDocumentAsync(Guid documentId)
        {
            var document = await _context.Documents.FindAsync(documentId);
            if (document == null)
                throw new Exception("Document not found");

            var collaborators = _context.DocumentCollaborators
                .Where(dc => dc.DocumentId == documentId);
            _context.DocumentCollaborators.RemoveRange(collaborators);

            var chatMessages = _context.ChatMessages
                .Where(cm => cm.DocumentId == documentId);
            _context.ChatMessages.RemoveRange(chatMessages);

            var invites = _context.DocumentInvites
                .Where(i => i.DocumentId == documentId);
            _context.DocumentInvites.RemoveRange(invites);

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();
        }

        public async Task<object> GetStatisticsAsync()
        {
            return new
            {
                totalUsers = await _context.Users.CountAsync(),
                totalDocuments = await _context.Documents.CountAsync(),
                totalMessages = await _context.ChatMessages.CountAsync(),
                totalFriendships = await _context.Friendships
                    .CountAsync(f => f.Status == "Accepted")
            };
        }
    }
}