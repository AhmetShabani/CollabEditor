namespace CollabEditor.API.Services
{
    public interface IFriendService
    {
        Task SendFriendRequestAsync(Guid senderId, string receiverUsername);
        Task<IEnumerable<object>> GetPendingRequestsAsync(Guid userId);
        Task AcceptFriendRequestAsync(Guid requestId, Guid userId);
        Task DeclineFriendRequestAsync(Guid requestId, Guid userId);
        Task<IEnumerable<object>> GetFriendsAsync(Guid userId);
        Task RemoveFriendAsync(Guid friendshipId, Guid userId);
    }
}