import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiMessageComponent } from './ai-message.component';

describe('AiMessageComponent', () => {
  let component: AiMessageComponent;
  let fixture: ComponentFixture<AiMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiMessageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
