namespace CollabEditor.API.Services
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(Guid userId, string title, string message, string? link = null);
        Task<IEnumerable<object>> GetNotificationsAsync(Guid userId);
        Task MarkAsReadAsync(Guid notificationId, Guid userId);
        Task MarkAllAsReadAsync(Guid userId);
    }
}