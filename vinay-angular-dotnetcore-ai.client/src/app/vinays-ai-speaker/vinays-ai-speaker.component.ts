import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'vinays-ai-speaker',
  templateUrl: './vinays-ai-speaker.component.html',
  styleUrls: ['./vinays-ai-speaker.component.css'],
  imports: [LottieComponent, FormsModule],
})
export class AiSpeakerComponent implements OnChanges {
  updateText() {
    this.speakText(this.textToSpeak);
  }
  @Input() textToSpeak: string = '';
  isSpeaking: boolean = false;

  options: AnimationOptions = {
    path: '/assets/lottie/chatting-robot.json',
    loop: true,
    autoplay: false
  };

  animation: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['textToSpeak'] && this.textToSpeak) {
      this.speakText(this.textToSpeak);
    }
  }

  speakText(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.animation?.play();
      };
      utterance.onend = () => {
        this.isSpeaking = false;
        this.animation?.stop();
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Text-to-Speech not supported in this browser.');
    }
  }

  handleAnimation(anim: any): void {
    this.animation = anim;
  }
}
