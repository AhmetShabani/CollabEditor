using Microsoft.EntityFrameworkCore;
using CollabEditor.API.Models.Entities;

namespace CollabEditor.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Document> Documents { get; set; } = null!; 
        public DbSet<DocumentCollaborator> DocumentCollaborators { get; set; } = null!;
        public DbSet<ChatMessage> ChatMessages { get; set; } = null!;
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<DocumentCollaborator>()
                .HasKey(dc => new { dc.UserId, dc.DocumentId });

            modelBuilder.Entity<DocumentCollaborator>()
                .HasOne(dc => dc.User)
                .WithMany()
                .HasForeignKey(dc => dc.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<DocumentCollaborator>()
                .HasOne(dc => dc.Document)
                .WithMany()
                .HasForeignKey(dc => dc.DocumentId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
