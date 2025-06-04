import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriteReviewFormComponent } from './write-review-form.component';

describe('WriteReviewFormComponent', () => {
  let component: WriteReviewFormComponent;
  let fixture: ComponentFixture<WriteReviewFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WriteReviewFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WriteReviewFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
