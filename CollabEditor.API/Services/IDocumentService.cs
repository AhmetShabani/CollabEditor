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
        
    }
}
