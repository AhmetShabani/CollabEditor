using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace CollabEditor.API.Hubs
{
    [Authorize]
    public class CodeHub : Hub
    {
        public async Task JoinDocument(string documentId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, documentId);
            await Clients.OthersInGroup(documentId).SendAsync("UserJoined", Context.ConnectionId);
        }
        public async Task LeaveDocument(string documentId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, documentId);
            await Clients.Group(documentId).SendAsync("UserLeft", Context.ConnectionId);
        }
        public async Task SendCodeChange(string documentId,string content)
        {
            await Clients.OthersInGroup(documentId).SendAsync("CodeChanged", content);
        }
        public async Task SendCursorPosition(string documentId, int line, int column) 
        {
            await Clients.OthersInGroup(documentId).SendAsync("CursorMoved", Context.ConnectionId, line, column);
        }
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Clients.Others.SendAsync("UserLeft", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
        public async Task SendChatMessage(string documentId, string message)
        {
            var username = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
            await Clients.Group(documentId).SendAsync("ChatMessage", username, message, DateTime.UtcNow);
        }
    }
}
