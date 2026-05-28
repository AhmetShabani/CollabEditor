using CollabEditor.API.Data;
using CollabEditor.API.Models.DTOs;
using CollabEditor.API.Models.Entities;
using Microsoft.EntityFrameworkCore;


namespace CollabEditor.API.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly AppDbContext _context;

        public DocumentService(AppDbContext context)
        {
            _context = context;
        }
        public async Task<DocumentResponse> CreateAsync(CreateDocumentRequest createDocumentRequest, Guid userId)
        {
           
            var document = new Document
            {
                Id = Guid.NewGuid(),
                Title = createDocumentRequest.Title,
                Content = createDocumentRequest.Content,
                Language = createDocumentRequest.Language,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                OwnerId = userId

            };
            await _context.Documents.AddAsync(document);
            await _context.SaveChangesAsync();
            var owner = await _context.Users.FindAsync(userId);
            return new DocumentResponse
            {
                Id = document.Id,
                Title = document.Title,
                Content = document.Content,
                Language = document.Language,
                OwnerId = document.OwnerId,
                OwnerUsername = owner!.Username,
                CreatedAt = document.CreatedAt,
                UpdatedAt = document.UpdatedAt
            };


        }

        public async Task<IEnumerable<DocumentResponse>> GetAllAsync(Guid userId)
        {
            var documents = await _context.Documents
            .Where(d => d.OwnerId == userId)
            .Include(d => d.Owner)
            .ToListAsync();

            return documents.Select(d => new DocumentResponse
            {
                Id = d.Id,
                Title = d.Title,
                Content = d.Content,
                Language = d.Language,
                OwnerId = d.OwnerId,
                OwnerUsername = d.Owner.Username,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt

            }).ToList();

        }

        public async Task<DocumentResponse> GetByIdAsync(Guid documentId, Guid userId)
        {
            var document = await _context.Documents
            .Include(d => d.Owner)
            .FirstOrDefaultAsync(d => d.Id == documentId && d.OwnerId == userId);
            if (document == null)
            {
                throw new Exception("Document not found");
            }
            return new DocumentResponse
            {
                Id = document.Id,
                Title = document.Title,
                Content = document.Content,
                Language = document.Language,
                OwnerId = document.OwnerId,
                OwnerUsername = document.Owner.Username,
                CreatedAt = document.CreatedAt,
                UpdatedAt = document.UpdatedAt
            };

        }
        public async Task<DocumentResponse> UpdateAsync(Guid documentId, Guid userId, UpdateDocumentRequest update)
        {

            var document = await _context.Documents
            .Include(d => d.Owner)
            .FirstOrDefaultAsync(d => d.Id == documentId && d.OwnerId == userId);
            if (document == null)
            {
                throw new Exception("Document not found");
            };
            document.Title = update.Title;
            document.Content = update.Content;
            document.Language = update.Language;
            document.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return new DocumentResponse
            {
                Id = document.Id,
                Title = document.Title,
                Content = document.Content,
                Language = document.Language,
                OwnerId = document.OwnerId,
                OwnerUsername = document.Owner.Username,
                CreatedAt = document.CreatedAt,
                UpdatedAt = document.UpdatedAt
            };

        }
        public async Task<bool> DeleteAsync(Guid documentId, Guid userId)
        {
           var document = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == documentId && d.OwnerId == userId);
            if (document == null)
            {
                return false;
            }
            _context.Remove(document);
            await _context.SaveChangesAsync();
            return true;
            
        }

        public async Task<IEnumerable<object>> GetChatHistoryAsync(Guid documentId, Guid userId)
        {
            var document = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == documentId && d.OwnerId == userId);

            if (document == null)
                throw new Exception("Document not found");

            var messages = await _context.ChatMessages
                .Where(m => m.DocumentId == documentId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new
                {
                    username = m.Username,
                    message = m.Message,
                    timestamp = m.CreatedAt
                })
                .ToListAsync();

            return messages;
        }
    }
}
