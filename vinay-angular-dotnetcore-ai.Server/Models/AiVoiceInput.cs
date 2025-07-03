using Microsoft.CognitiveServices.Speech.Transcription;

namespace vinay_angular_dotnetcore_ai.Server.Models
{
    public class AiVoiceInput
    {
        public string InputSentence { get; set; } = null!;
     
        public string UserId { get; set; } = null!;

        public List<ConversationWithAi> ConversationHistory { get; set; }
    }
}
