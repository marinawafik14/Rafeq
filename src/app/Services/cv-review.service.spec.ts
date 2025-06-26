import { TestBed } from '@angular/core/testing';

import { CvReviewService } from './cv-review.service';

describe('CvReviewService', () => {
  let service: CvReviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CvReviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
