import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiInputAreaComponent } from './ai-input-area.component';

describe('AiInputAreaComponent', () => {
  let component: AiInputAreaComponent;
  let fixture: ComponentFixture<AiInputAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiInputAreaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiInputAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
