import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';


interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string;
}

@Component({
  selector: 'vinays-webcam',
  standalone: false,
  templateUrl: './vinays-web-camera.component.html',
  styleUrl: './vinays-web-camera.component.css'
})
export class VinaysWebCameraComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder!: MediaRecorder;
  private audioChunks: Blob[] = [];
  isRecording = false;


  public forecasts: WeatherForecast[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.startCamera();
  }

  async startCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.mediaStream;
      }

      // this.mediaRecorder = new MediaRecorder(this.mediaStream);
      // this.audioChunks = [];
      // this.mediaRecorder.ondataavailable = (event) => {
      //   this.audioChunks.push(event.data);
      // };
      // this.mediaRecorder.onstop = () => {
      //   const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      //   this.sendRecording(audioBlob);
      // };

      // var audioData = this.mediaStream?.getAudioTracks();
      // console.log(audioData);

    } catch (err) {
      console.error('Error accessing webcam: ', err);
    }
  }

  async startVoiceRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);

    this.audioChunks = [];
    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.sendVoiceRecording(audioBlob);
    };

    this.mediaRecorder.start();
    this.isRecording = true;
  }

  stopVoiceRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  sendVoiceRecording(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    this.http.post('https://your-api-endpoint.com/upload', formData).subscribe({
      next: (response) => console.log('Upload success:', response),
      error: (error) => console.error('Upload error:', error)
    });
  }

  captureScreenshot(): void {
    const video = this.videoElement.nativeElement;
    const canvasEl = this.canvas.nativeElement;
    canvasEl.width = video.videoWidth;
    canvasEl.height = video.videoHeight;
    const context = canvasEl.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvasEl.width, canvasEl.height);

      canvasEl.toBlob((blob) => {
        if (blob) {
          this.sendScreenshotToAPI(blob);
        }
      }, 'image/png');
    }
  }


  sendScreenshotToAPI(imageBlob: Blob): void {
    const formData = new FormData();
    formData.append('file', imageBlob, 'screenshot.png');

    this.http.post('/weatherforecast', formData).subscribe({
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
  }

  stopCamera(): void {
    this.mediaStream?.getTracks().forEach(track => track.stop());
  }
}
