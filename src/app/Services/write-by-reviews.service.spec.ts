import { TestBed } from '@angular/core/testing';

import { WriteByReviewsService } from './write-by-reviews.service';

describe('WriteByReviewsService', () => {
  let service: WriteByReviewsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WriteByReviewsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
