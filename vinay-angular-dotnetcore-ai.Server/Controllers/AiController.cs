using Azure;
using Azure.AI.OpenAI;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using OpenAI.Chat;
using vinay_angular_dotnetcore_ai.Server.Models;
using Azure.Identity;
using static System.Environment;
using Microsoft.CognitiveServices.Speech.Transcription;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace vinay_angular_dotnetcore_ai.Server.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    [EnableCors("allowCors")]
    public class AiController(IConfiguration configuration) : ControllerBase
    {
        private static readonly Dictionary<string, List<ChatMessage>> UserHistories = new();
        private readonly string? _openAiKey = GetEnvironmentVariable("AZURE_OPENAI_API_KEY");
        private readonly string? _openAiEndpoint = GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT");
        private readonly bool _useHistoryFromUi = Convert.ToBoolean(configuration["UseHistoryFromUI"]);

        [HttpGet]
        [Route("GetAzureSpeechSettings")]
        public AiConfig GetAzureSpeechSettings()
        {
            AiConfig settings = new AiConfig();

            return settings;
        }

        // POST api/<AiController>
        [HttpPost]
        [Route("SpeakToAi")]
        public AiVoiceOutput SpeakToAi([FromBody] AiVoiceInput voiceInput)
        {
            var nonNullQuestion = voiceInput?.InputSentence?.Length > 0;
            string? outputSentence;
            if (nonNullQuestion)
            {
                outputSentence = $"\"{voiceInput.InputSentence}\"";

                string aiResponseAnswer = ChatWithAi(voiceInput);
                if (!string.IsNullOrEmpty(aiResponseAnswer))
                {
                    outputSentence = aiResponseAnswer;
                }
            }
            else
                outputSentence = $"You were quiet!";


            return new AiVoiceOutput { OutputSentence = outputSentence };
        }

        private string ChatWithAi(AiVoiceInput voiceInput)
        {
            AzureOpenAIClient azureClient = new(new Uri(_openAiEndpoint), new AzureKeyCredential(_openAiKey));
            ChatClient chatClient = azureClient.GetChatClient("gpt-4.1");

            var requestOptions = new ChatCompletionOptions()
            {
                MaxOutputTokenCount = 800,
                Temperature = 1.0f,
                TopP = 1.0f,
                FrequencyPenalty = 0.0f,
                PresencePenalty = 0.0f,
            };

            List<ChatMessage> chatMessages;
            if (_useHistoryFromUi)
            {
                // Give the AI some context about the conversation
                chatMessages =
                [
                    new SystemChatMessage("You are a helpful assistant."),
                    new SystemChatMessage("You provide short answers."),
                ];

                // Add the conversation history if available
                foreach (var conversation in voiceInput.ConversationHistory)
                {
                    chatMessages.Add(new UserChatMessage(conversation.InputSentence));
                    chatMessages.Add(new AssistantChatMessage(conversation.AIResponse));
                }

                // Add the latest user input question
                chatMessages.Add(new UserChatMessage(voiceInput.InputSentence));
            }
            else
            {
                string userId = voiceInput.UserId;
                if (!UserHistories.ContainsKey(userId))
                {
                    UserHistories[userId] = new List<ChatMessage>();
                }

                UserHistories[userId].Add(new UserChatMessage(voiceInput.InputSentence));
                chatMessages = UserHistories[userId];
            }

            var response = chatClient.CompleteChat(chatMessages, requestOptions);
            var responseAnswer = response.Value.Content[0].Text;

            return responseAnswer;
        }
    }
}
