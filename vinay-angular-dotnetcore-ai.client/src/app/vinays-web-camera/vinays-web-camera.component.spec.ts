import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VinaysWebCameraComponent } from './vinays-web-camera.component';

describe('VinaysWebCameraComponent', () => {
  let component: VinaysWebCameraComponent;
  let fixture: ComponentFixture<VinaysWebCameraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VinaysWebCameraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VinaysWebCameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
