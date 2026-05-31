using CollabEditor.API.Models.DTOs;

namespace CollabEditor.API.Services
{
    public interface IDocumentService
    {
        Task<DocumentResponse> CreateAsync(CreateDocumentRequest createDocumentRequest, Guid userID);
        Task<IEnumerable<DocumentResponse>> GetAllAsync(Guid userId);

        Task<DocumentResponse> GetByIdAsync(Guid documentId, Guid userId);

        Task<DocumentResponse> UpdateAsync(Guid documentId, Guid userId,UpdateDocumentRequest update);

        Task<bool> DeleteAsync(Guid documentId, Guid userId);

        Task<IEnumerable<object>> GetChatHistoryAsync(Guid documentId, Guid userId);

        Task ClearChatAsync(Guid documentId, Guid userId);
        Task<CreateInviteResponse> CreateInviteAsync(Guid documentId, Guid userId, Guid? friendUserId = null);
        Task<JoinDocumentResponse> JoinByInviteAsync(string token, Guid userId);
        Task<IEnumerable<object>> GetCollaboratorsAsync(Guid documentId, Guid userId);
        Task RemoveCollaboratorAsync(Guid documentId, Guid collaboratorUserId, Guid ownerId);

        
    }
}
