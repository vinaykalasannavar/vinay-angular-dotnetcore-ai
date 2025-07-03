namespace vinay_angular_dotnetcore_ai.Server.Models;

public class AiConfig
{
    public string SpeechKey { get; set; } = Environment.GetEnvironmentVariable("AZURE_SPEECH_KEY");

    public string ServiceRegion { get; set; } = Environment.GetEnvironmentVariable("AZURE_SPEECH_REGION");
}