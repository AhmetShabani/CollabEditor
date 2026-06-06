namespace CollabEditor.API.Services
{
    public interface IAdminService
    {
        Task<IEnumerable<object>> GetAllUsersAsync();
        Task DeleteUserAsync(Guid userId);
        Task ChangeUserRoleAsync(Guid userId, string role);
        Task<IEnumerable<object>> GetAllDocumentsAsync();
        Task DeleteDocumentAsync(Guid documentId);
        Task<object> GetStatisticsAsync();
    }
}