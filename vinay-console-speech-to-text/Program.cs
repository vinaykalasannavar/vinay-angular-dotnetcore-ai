using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;

static void OutputSpeechRecognitionResult(SpeechRecognitionResult speechRecognitionResult)
{
    switch (speechRecognitionResult.Reason)
    {
        case ResultReason.RecognizedSpeech:
            Console.WriteLine($"RECOGNIZED: Text={speechRecognitionResult.Text}");
            break;
        case ResultReason.NoMatch:
            Console.WriteLine($"NOMATCH: Speech could not be recognized.");
            break;
        case ResultReason.Canceled:
            var cancellation = CancellationDetails.FromResult(speechRecognitionResult);
            Console.WriteLine($"CANCELED: Reason={cancellation.Reason}");

            if (cancellation.Reason == CancellationReason.Error)
            {
                Console.WriteLine($"CANCELED: ErrorCode={cancellation.ErrorCode}");
                Console.WriteLine($"CANCELED: ErrorDetails={cancellation.ErrorDetails}");
                Console.WriteLine($"CANCELED: Did you set the speech resource key and endpoint values?");
            }
            break;
    }
}

string speechKey = Environment.GetEnvironmentVariable("AZURE_SPEECH_KEY");
string region = Environment.GetEnvironmentVariable("AZURE_SPEECH_REGION");
string endpoint = $"https://{region}.api.cognitive.microsoft.com/";

var speechConfig = SpeechConfig.FromEndpoint(new Uri(endpoint), speechKey);
speechConfig.SpeechRecognitionLanguage = "en-US";

using var audioConfig = AudioConfig.FromDefaultMicrophoneInput();
using var speechRecognizer = new SpeechRecognizer(speechConfig, audioConfig);

Console.WriteLine("Speak into your microphone.");
var speechRecognitionResult = await speechRecognizer.RecognizeOnceAsync();
OutputSpeechRecognitionResult(speechRecognitionResult);

ReplyToTheUser(speechRecognitionResult);

Console.WriteLine("Press any key to exit...");
Console.ReadKey();


async Task ReplyToTheUser(SpeechRecognitionResult speechRecognitionResult)
{
    var speechConfig = SpeechConfig.FromEndpoint(new Uri(endpoint), speechKey);

    // The neural multilingual voice can speak different languages based on the input text.
    speechConfig.SpeechSynthesisVoiceName = "en-US-AvaMultilingualNeural";

    using (var speechSynthesizer = new SpeechSynthesizer(speechConfig))
    {
        // Get text from the console and synthesize to the default speaker.
        Console.WriteLine("Enter some text that you want to speak >");
        string text = $"I think you said {speechRecognitionResult.Text}";

        var speechSynthesisResult = await speechSynthesizer.SpeakTextAsync(text);
        OutputSpeechSynthesisResult(speechSynthesisResult, text);
    }

}
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