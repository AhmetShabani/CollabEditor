namespace CollabEditor.API.Services
{
    public interface IAIService
    {
        Task<string> ReviewCodeAsync(string code, string language);
    }
}
