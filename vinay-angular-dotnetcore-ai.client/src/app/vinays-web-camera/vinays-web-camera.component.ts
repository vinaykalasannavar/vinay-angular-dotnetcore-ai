import { AfterViewInit, HostListener, Component, contentChild, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import * as faceapi from 'face-api.js';
import { Timeout } from 'microsoft-cognitiveservices-speech-sdk/distrib/lib/src/common/Timeout';
import { AiVoiceOutput } from './AiVoiceOutput';
import { ConversationWithAi } from './conversation-with-ai';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'vinays-webcam',
  standalone: false,
  templateUrl: './vinays-web-camera.component.html',
  styleUrl: './vinays-web-camera.component.css'
})
export class VinaysWebCameraComponent implements OnInit, OnDestroy, AfterViewInit {
  deleteMessage(conversation: ConversationWithAi) {
    const index = this.conversationHistory.findIndex(c => c.id == conversation.id);
    if (index > -1) {
      this.conversationHistory.splice(index, 1);
    }
  }
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasFaceDetection') canvasFaceDetection!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasScreenshot') canvasScreenshot!: ElementRef<HTMLCanvasElement>;
  private mediaStream: MediaStream | null = null;

  private mediaRecorder!: MediaRecorder;
  private chunks: Blob[] = [];
  public audioBlob: Blob | null = null;
  public audioURL: string | null = null;
  public isRecording = false;
  public conversationHistory: ConversationWithAi[] = [];

  recognizedText = '';
  isListening = false;
  isDetecting = false;

  private recognizer: SpeechSDK.SpeechRecognizer | null = null;
  private synthesizer: SpeechSDK.SpeechSynthesizer | null = null;

  private speechKey = '';
  private serviceRegion = '';
  intervalCallBack: NodeJS.Timeout | undefined;
  recognizedVideoExpression: string | undefined;
  aiAnswer: string | undefined;
  pictureExpression: string | undefined;

  @Input() textToSpeak: string = '';
  userId: any;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    // Initialize the userId with a unique identifier
    this.userId = uuidv4();
    this.fetchAzureSpeechSettings();
    this.startVideo();
  }

  fetchAzureSpeechSettings() {
    // Fetch Azure Speech settings from the server
    this.http.get<{ speechKey: string, serviceRegion: string }>(`https://localhost:7145/api/Ai/GetAzureSpeechSettings`).subscribe({
      next: (data) => {
        this.speechKey = data.speechKey;
        this.serviceRegion = data.serviceRegion;
        console.log('Azure Speech settings fetched successfully:', data);
      },
      error: (error) => {
        console.error('Error fetching Azure Speech settings:', error);
      }
    });
  }


  startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then((stream) => {
        this.videoElement.nativeElement.srcObject = stream;
        this.videoElement.nativeElement.play();
      })
      .catch(err => console.error('Error accessing webcam:', err));
  }

  async ngAfterViewInit() {
    await this.loadModels();

    const video = this.videoElement.nativeElement;

    // Resize once metadata is loaded (i.e., video size becomes available)
    video.addEventListener('loadedmetadata', () => {
      console.log('video loadedmetadata done');

      this.resizeCanvasToVideo();
    });

    this.resizeCanvasToVideo();
  }


  @HostListener('window:resize')
  onResize() {
    this.resizeCanvasToVideo();
  }

  private resizeCanvasToVideo(): void {
    const videoElement = this.videoElement.nativeElement;
    const canvasFaceDetection = this.canvasFaceDetection.nativeElement;

    if (videoElement && canvasFaceDetection) {
      canvasFaceDetection.width = videoElement.clientWidth;
      canvasFaceDetection.height = videoElement.clientHeight;
    }
  }

  async loadModels() {
    const MODEL_URL = '/assets/models'; // Place models here
    // const MODEL_URL_DISK = './src/assets/models'; // Place models here
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
  }

  async stopDetection() {
    const canvasFaceDetection = this.canvasFaceDetection.nativeElement;
    const ctx = canvasFaceDetection.getContext('2d');

    // Stop the detection interval
    clearInterval(this.intervalCallBack);

    if (ctx) {
      setTimeout(() => {
        ctx.clearRect(0, 0, canvasFaceDetection.width, canvasFaceDetection.height);
        this.recognizedVideoExpression = `I stopped looking at you now.`;
      }, 250);;
    }

    console.log('Face detection stopped.');
    this.isDetecting = false;
  }

  async detectExpression() {
    this.isDetecting = true;

    const video = this.videoElement.nativeElement;
    const canvasFaceDetection = this.canvasFaceDetection.nativeElement;

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvasFaceDetection, displaySize);

    let startDetectionCallBack = async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const ctx = canvasFaceDetection.getContext('2d');
      ctx?.clearRect(0, 0, canvasFaceDetection.width, canvasFaceDetection.height);

      // Draw bounding boxes
      faceapi.draw.drawDetections(canvasFaceDetection, resizedDetections);

      // Draw facial landmarks
      faceapi.draw.drawFaceLandmarks(canvasFaceDetection, resizedDetections);

      // Draw facial expressions
      resizedDetections.forEach(det => {
        const { expressions, detection } = det;
        const { x, y } = detection.box;
        const topExpression = Object.entries(expressions)
          .sort((a, b) => b[1] - a[1])[0]; // Get most probable expression

        if (topExpression) {

          const { expression, probability } = this.readExpressionValues(topExpression);
          this.recognizedVideoExpression = `Aw, you look ${probability}% ${expression}!`;

          ctx!.font = '16px Arial';
          ctx!.fillStyle = 'red';
          ctx!.fillText(`${topExpression[0]} (${probability}%)`, x, y - 10);
        }
      });
    };

    this.intervalCallBack = setInterval(startDetectionCallBack, 200);
  }

  startListening(): void {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(this.speechKey, this.serviceRegion);
    speechConfig.speechRecognitionLanguage = 'en-GB';

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    this.recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    this.recognizer.recognizing = (s, e) => {
      console.log('Recognizing:', e.result.text);
    };

    this.recognizer.recognized = (s, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        console.log('Recognized:', e.result.text);
        this.recognizedText = e.result.text + ' ';

        this.talkToAi(e.result.text);
      }
    };

    this.recognizer.sessionStopped = () => {
      this.isListening = false;
      this.recognizer?.stopContinuousRecognitionAsync();
    };

    this.isListening = true;
    this.recognizer.startContinuousRecognitionAsync();
  }

  stopListening(): void {
    if (this.recognizer && this.isListening) {
      this.recognizer.stopContinuousRecognitionAsync(() => {
        this.isListening = false;
      });
    }
  }

  talkToAi(inputSentence: string): void {

    const formData = { 'inputSentence': inputSentence, 'userId': this.userId, 'conversationHistory': this.conversationHistory };

    console.log('Sending to AI:', inputSentence);
    console.log('FormData:', formData);

    if (inputSentence.length > 0) {
      this.http.post('https://localhost:7145/api/Ai/SpeakToAi', formData).subscribe({
        next: (result) => {
          var data = result as AiVoiceOutput;
          console.log(data);
          this.aiAnswer = data.outputSentence;
          this.conversationHistory.push({ inputSentence: inputSentence, aiResponse: this.aiAnswer, id: uuidv4() });
          this.speakAnswer(data.outputSentence);
        },
        error: (error) => {
          console.error(error);
        }
      }
      );
    }
  }


  updateText() {
    this.speakAnswer(this.textToSpeak);
  }

  speakAnswer(textToSpeak: string): void {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(this.speechKey, this.serviceRegion);
    speechConfig.speechRecognitionLanguage = 'en-GB';
    speechConfig.speechSynthesisVoiceName = "en-IN-AvaMultilingualNeural";
    speechConfig.speechSynthesisVoiceName = "en-US-AvaMultilingualNeural";

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(
      textToSpeak,
      result => {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          console.log('Speech synthesized successfully.');
        } else {
          console.error('Speech synthesis failed:', result.errorDetails);
        }
        synthesizer.close();
      },
      error => {
        console.error('Error synthesizing speech:', error);
        synthesizer.close();
      }
    );

  }

  async startCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.mediaStream;
      }

    } catch (err) {
      console.error('Error accessing webcam: ', err);
    }
  }

  async captureScreenshot(): Promise<void> {
    const video = this.videoElement.nativeElement;
    const canvasScreenshot = this.canvasScreenshot.nativeElement;
    canvasScreenshot.width = video.videoWidth;
    canvasScreenshot.height = video.videoHeight;
    const context = canvasScreenshot.getContext('2d');
    if (context) {
      context?.clearRect(0, 0, canvasScreenshot.width, canvasScreenshot.height);

      context.drawImage(video, 0, 0, canvasScreenshot.width, canvasScreenshot.height);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Draw bounding boxes
      faceapi.draw.drawDetections(canvasScreenshot, resizedDetections);

      // Draw facial landmarks
      faceapi.draw.drawFaceLandmarks(canvasScreenshot, resizedDetections);

      resizedDetections.forEach(det => {
        const { expressions, detection } = det;
        const { x, y } = detection.box;
        const topExpression = Object.entries(expressions)
          .sort((a, b) => b[1] - a[1])[0]; // Get most probable expression

        if (topExpression) {
          const { expression, probability } = this.readExpressionValues(topExpression);

          this.pictureExpression = `You look ${probability}% ${expression}!`;

          this.speakAnswer(this.pictureExpression); 4

          context!.font = '16px Arial';
          context!.fillStyle = 'red';
          context!.fillText(`${topExpression[0]} (${(topExpression[1] * 100).toFixed(1)}%)`, x, y - 10);
        }
      });
    }
  }

  private readExpressionValues(topExpression: [string, any]) {
    const expression = topExpression[0];
    const probability = (topExpression[1] * 100).toFixed(1);
    return { expression, probability };
  }

  sendFileToAPI(fileBlob: Blob, fileName: string): void {
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);

    //this.http.post('api/Upload', formData).subscribe({
    this.http.post('https://localhost:7145/Upload', formData).subscribe({
      next: (result) => {
        var data = result;
        console.log(data);
      },
      error: (error) => {
        console.error(error);
      }
    }
    );
  }

  ngOnDestroy(): void {
    this.stopCamera();

    this.stopListening();
  }

  stopCamera(): void {
    this.mediaStream?.getTracks().forEach(track => track.stop());
  }
}
