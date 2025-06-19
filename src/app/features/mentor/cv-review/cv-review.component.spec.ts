import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvReviewComponent } from './cv-review.component';

describe('CvReviewComponent', () => {
  let component: CvReviewComponent;
  let fixture: ComponentFixture<CvReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvReviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CvReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
