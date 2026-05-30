using CollabEditor.API.Data;
using CollabEditor.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CollabEditor.API.Services
{
    public class FriendService : IFriendService
    {
        private readonly AppDbContext _context;

        public FriendService(AppDbContext context)
        {
            _context = context;
        }

        public async Task SendFriendRequestAsync(Guid senderId, string receiverUsername)
        {
            var receiver = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == receiverUsername);

            if (receiver == null)
                throw new Exception("User not found");

            if (receiver.Id == senderId)
                throw new Exception("You cannot add yourself");

            var existing = await _context.Friendships
                .FirstOrDefaultAsync(f =>
                    (f.SenderId == senderId && f.ReceiverId == receiver.Id) ||
                    (f.SenderId == receiver.Id && f.ReceiverId == senderId));

            if (existing != null)
                throw new Exception("Friend request already exists");

            var friendship = new Friendship
            {
                Id = Guid.NewGuid(),
                SenderId = senderId,
                ReceiverId = receiver.Id,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            await _context.Friendships.AddAsync(friendship);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<object>> GetPendingRequestsAsync(Guid userId)
        {
            var requests = await _context.Friendships
                .Where(f => f.ReceiverId == userId && f.Status == "Pending")
                .Include(f => f.Sender)
                .Select(f => new
                {
                    id = f.Id,
                    senderUsername = f.Sender.Username,
                    senderId = f.SenderId,
                    createdAt = f.CreatedAt
                })
                .ToListAsync();

            return requests;
        }

        public async Task AcceptFriendRequestAsync(Guid requestId, Guid userId)
        {
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.Id == requestId && f.ReceiverId == userId);

            if (friendship == null)
                throw new Exception("Friend request not found");

            friendship.Status = "Accepted";
            await _context.SaveChangesAsync();
        }

        public async Task DeclineFriendRequestAsync(Guid requestId, Guid userId)
        {
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.Id == requestId && f.ReceiverId == userId);

            if (friendship == null)
                throw new Exception("Friend request not found");

            friendship.Status = "Declined";
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<object>> GetFriendsAsync(Guid userId)
        {
            var friends = await _context.Friendships
                .Where(f => (f.SenderId == userId || f.ReceiverId == userId) && f.Status == "Accepted")
                .Include(f => f.Sender)
                .Include(f => f.Receiver)
                .Select(f => new
                {
                    friendshipId = f.Id,
                    userId = f.SenderId == userId ? f.ReceiverId : f.SenderId,
                    username = f.SenderId == userId ? f.Receiver.Username : f.Sender.Username
                })
                .ToListAsync();

            return friends;
        }

        public async Task RemoveFriendAsync(Guid friendshipId, Guid userId)
        {
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.Id == friendshipId &&
                    (f.SenderId == userId || f.ReceiverId == userId));

            if (friendship == null)
                throw new Exception("Friendship not found");

            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();
        }
    }
}