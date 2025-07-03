// See https://aka.ms/new-console-template for more information
using Microsoft.CognitiveServices.Speech;

static void OutputSpeechSynthesisResult(SpeechSynthesisResult speechSynthesisResult, string text)
{
    switch (speechSynthesisResult.Reason)
    {
        case ResultReason.SynthesizingAudioCompleted:
            Console.WriteLine($"Speech synthesized for text: [{text}]");
            break;
        case ResultReason.Canceled:
            var cancellation = SpeechSynthesisCancellationDetails.FromResult(speechSynthesisResult);
            Console.WriteLine($"CANCELED: Reason={cancellation.Reason}");

            if (cancellation.Reason == CancellationReason.Error)
            {
                Console.WriteLine($"CANCELED: ErrorCode={cancellation.ErrorCode}");
                Console.WriteLine($"CANCELED: ErrorDetails=[{cancellation.ErrorDetails}]");
                Console.WriteLine($"CANCELED: Did you set the speech resource key and endpoint values?");
            }
            break;
        default:
            break;
    }
}

string speechKey = Environment.GetEnvironmentVariable("AZURE_SPEECH_KEY");
string region = Environment.GetEnvironmentVariable("AZURE_SPEECH_REGION");
string endpoint = $"https://{region}.api.cognitive.microsoft.com/";

var speechConfig = SpeechConfig.FromEndpoint(new Uri(endpoint), speechKey);

// The neural multilingual voice can speak different languages based on the input text.
speechConfig.SpeechSynthesisVoiceName = "en-US-AvaMultilingualNeural";

using (var speechSynthesizer = new SpeechSynthesizer(speechConfig))
{
    // Get text from the console and synthesize to the default speaker.
    Console.WriteLine("Enter some text that you want to speak >");
    string text = Console.ReadLine();

    var speechSynthesisResult = await speechSynthesizer.SpeakTextAsync(text);
    OutputSpeechSynthesisResult(speechSynthesisResult, text);
}

Console.WriteLine("Press any key to exit...");
Console.ReadKey();