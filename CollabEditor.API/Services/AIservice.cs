using CollabEditor.API.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;

namespace CollabEditor.API.Services
{
    public class AIService : IAIService
    {
        private readonly GroqSettings _groqSettings;
        private readonly HttpClient _httpClient;

        public AIService(IOptions<GroqSettings> groqSettings, HttpClient httpClient)
        {
            _groqSettings = groqSettings.Value;
            _httpClient = httpClient;
        }

        public async Task<string> ReviewCodeAsync(string code, string language)
        {
            var prompt = $@"You are an expert code reviewer. Review the following {language} code and provide:
1. Bug detection
2. Performance improvements
3. Best practices
4. Security issues if any

Keep the review concise and actionable.

Code to review:
````{language}
{code}
```";

            var requestBody = new
            {
                model = _groqSettings.Model,
                messages = new[]
                {
                    new { role = "user", content = prompt }
                },
                max_tokens = 1000,
                temperature = 0.3
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_groqSettings.ApiKey}");

            var response = await _httpClient.PostAsync(
                "https://api.groq.com/openai/v1/chat/completions", content);

            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDoc = JsonDocument.Parse(responseBody);

            return jsonDoc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString()!;
        }
    }
}


