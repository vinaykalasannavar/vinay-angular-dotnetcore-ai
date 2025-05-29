import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

export function playerFactory() {
  return player;
}

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { VinaysWebCameraComponent } from './vinays-web-camera/vinays-web-camera.component';
import { AiSpeakerComponent } from './vinays-ai-speaker/vinays-ai-speaker.component';
import player from 'lottie-web';
import { LottieComponent, provideLottieOptions } from 'ngx-lottie';


@NgModule({
  declarations: [
    AppComponent,
    VinaysWebCameraComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AiSpeakerComponent,
    HttpClientModule,
    LottieComponent
  ],
  providers: [
    provideLottieOptions({ player: () => import('lottie-web') }),
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {}
}
