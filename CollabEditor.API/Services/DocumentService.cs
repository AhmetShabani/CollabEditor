using CollabEditor.API.Data;
using CollabEditor.API.Models.DTOs;
using CollabEditor.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;


namespace CollabEditor.API.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public DocumentService(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
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
            // Get owned documents
            var ownedDocuments = await _context.Documents
                .Where(d => d.OwnerId == userId)
                .Include(d => d.Owner)
                .ToListAsync();

            // Get collaborated documents
            var collaboratedDocuments = await _context.DocumentCollaborators
                .Where(dc => dc.UserId == userId)
                .Include(dc => dc.Document)
                .ThenInclude(d => d.Owner)
                .Select(dc => dc.Document)
                .ToListAsync();

            // Combine both
            var allDocuments = ownedDocuments
                .Union(collaboratedDocuments)
                .Select(d => new DocumentResponse
                {
                    Id = d.Id,
                    Title = d.Title,
                    Content = d.Content,
                    Language = d.Language,
                    OwnerId = d.OwnerId,
                    OwnerUsername = d.Owner.Username,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                });

            return allDocuments;
        }

        public async Task<DocumentResponse> GetByIdAsync(Guid documentId, Guid userId)
        {
            var document = await _context.Documents
                .Include(d => d.Owner)
                .FirstOrDefaultAsync(d => d.Id == documentId);

            if (document == null)
                throw new Exception("Document not found");

            // Check if user is owner or collaborator
            var isOwner = document.OwnerId == userId;
            var isCollaborator = await _context.DocumentCollaborators
                .AnyAsync(dc => dc.DocumentId == documentId && dc.UserId == userId);

            if (!isOwner && !isCollaborator)
                throw new Exception("Access denied");

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

            if (document == null) return false;

            // Delete related records first
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
            return true;
        }

        public async Task<IEnumerable<object>> GetChatHistoryAsync(Guid documentId, Guid userId)
        {
            // Check if user is owner or collaborator
            var document = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == documentId);

            if (document == null)
                throw new Exception("Document not found");

            var isOwner = document.OwnerId == userId;
            var isCollaborator = await _context.DocumentCollaborators
                .AnyAsync(dc => dc.DocumentId == documentId && dc.UserId == userId);

            if (!isOwner && !isCollaborator)
                throw new Exception("Access denied");

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

        public async Task ClearChatAsync(Guid documentId, Guid userId)
        {
            var document = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == documentId && d.OwnerId == userId);

            if (document == null)
                throw new Exception("Document not found or you are not the owner");

            var messages = _context.ChatMessages
                .Where(m => m.DocumentId == documentId);

            _context.ChatMessages.RemoveRange(messages);
            await _context.SaveChangesAsync();
        }

        public async Task<CreateInviteResponse> CreateInviteAsync(Guid documentId, Guid userId, Guid? friendUserId = null)
        {
            var document = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == documentId && d.OwnerId == userId);

            if (document == null)
                throw new Exception("Document not found or you are not the owner");

            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
                .Replace("+", "-").Replace("/", "_").Replace("=", "");

            var invite = new DocumentInvite
            {
                Id = Guid.NewGuid(),
                DocumentId = documentId,
                Token = token,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(1),
                CreatedByUserId = userId
            };

            await _context.DocumentInvites.AddAsync(invite);
            await _context.SaveChangesAsync();

            // Send notification to friend if specified
            if (friendUserId.HasValue)
            {
                var sender = await _context.Users.FindAsync(userId);
                await _notificationService.CreateNotificationAsync(
                    friendUserId.Value,
                    "Document Invite",
                    $"{sender!.Username} invited you to collaborate on '{document.Title}'",
                    $"http://localhost:5173/invite/{token}"
                );
            }

            return new CreateInviteResponse
            {
                Token = token,
                InviteLink = $"http://localhost:5173/invite/{token}",
                ExpiresAt = invite.ExpiresAt
            };
        }
        public async Task<JoinDocumentResponse> JoinByInviteAsync(string token, Guid userId)
        {
            var invite = await _context.DocumentInvites
                .Include(i => i.Document)
                .FirstOrDefaultAsync(i => i.Token == token);

            if (invite == null)
                throw new Exception("Invalid invite link");

            if (invite.ExpiresAt < DateTime.UtcNow)
                throw new Exception("Invite link has expired");

            // Check if already a collaborator
            var existing = await _context.DocumentCollaborators
                .FirstOrDefaultAsync(dc => dc.DocumentId == invite.DocumentId && dc.UserId == userId);

            if (existing != null)
                return new JoinDocumentResponse
                {
                    DocumentId = invite.DocumentId,
                    DocumentTitle = invite.Document.Title,
                    Role = existing.Role
                };

            // Check if they are the owner
            if (invite.Document.OwnerId == userId)
                return new JoinDocumentResponse
                {
                    DocumentId = invite.DocumentId,
                    DocumentTitle = invite.Document.Title,
                    Role = "Owner"
                };

            // Add as collaborator
            var collaborator = new DocumentCollaborator
            {
                UserId = userId,
                DocumentId = invite.DocumentId,
                Role = "Collaborator",
                JoinedAt = DateTime.UtcNow
            };

            await _context.DocumentCollaborators.AddAsync(collaborator);
            await _context.SaveChangesAsync();

            return new JoinDocumentResponse
            {
                DocumentId = invite.DocumentId,
                DocumentTitle = invite.Document.Title,
                Role = "Collaborator"
            };
        }

        public async Task<IEnumerable<object>> GetCollaboratorsAsync(Guid documentId, Guid userId)
        {
            var document = await _context.Documents
                .Include(d => d.Owner)
                .FirstOrDefaultAsync(d => d.Id == documentId);

            if (document == null)
                throw new Exception("Document not found");

          
            var isOwner = document.OwnerId == userId;
            var isCollaborator = await _context.DocumentCollaborators
                .AnyAsync(dc => dc.DocumentId == documentId && dc.UserId == userId);

            if (!isOwner && !isCollaborator)
                throw new Exception("Access denied");

          
            var collaborators = await _context.DocumentCollaborators
                .Where(dc => dc.DocumentId == documentId)
                .Include(dc => dc.User)
                .Select(dc => new
                {
                    userId = dc.UserId,
                    username = dc.User.Username,
                    role = dc.Role,
                    joinedAt = dc.JoinedAt
                })
                .ToListAsync();

                     
                      var result = new List<object>
                {
                    new
                    {
                        userId = document.OwnerId,
                        username = document.Owner.Username,
                        role = "Owner",
                        joinedAt = document.CreatedAt
                    }
                };

                        result.AddRange(collaborators);
                        return result;
                    }

        public async Task RemoveCollaboratorAsync(Guid documentId, Guid collaboratorUserId, Guid ownerId)
        {
            var document = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == documentId && d.OwnerId == ownerId);

            if (document == null)
                throw new Exception("Document not found or you are not the owner");

            var collaborator = await _context.DocumentCollaborators
                .FirstOrDefaultAsync(dc => dc.DocumentId == documentId && dc.UserId == collaboratorUserId);

            if (collaborator == null)
                throw new Exception("Collaborator not found");

            _context.DocumentCollaborators.Remove(collaborator);
            await _context.SaveChangesAsync();
        }
    }
}
