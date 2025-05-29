import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiSpeakerComponent } from './vinays-ai-speaker.component';

describe('AiSpeakerComponent', () => {
  let component: AiSpeakerComponent;
  let fixture: ComponentFixture<AiSpeakerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AiSpeakerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiSpeakerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
