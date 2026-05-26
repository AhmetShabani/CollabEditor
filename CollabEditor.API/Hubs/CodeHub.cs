using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CollabEditor.API.Hubs
{
    [Authorize]
    public class CodeHub : Hub
    {
        public async Task JoinDocument(string documentId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, documentId);
            await Clients.Group(documentId).SendAsync("UserJoined", Context.ConnectionId);
        }
        public async Task LeaveDocument(string documentId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, documentId);
            await Clients.Group(documentId).SendAsync("UserLeft", Context.ConnectionId);
        }
        public async Task SendCodeChange(string documentId,string content)
        {
            await Clients.Group(documentId).SendAsync("CodeChanged", content);
        }
        public async Task SendCursorPosition(string documentId, int line, int column) 
        {
            await Clients.Group(documentId).SendAsync("CursorMoved", Context.ConnectionId, line, column);
        }
    }
}
