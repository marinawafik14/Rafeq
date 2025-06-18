import { TestBed } from '@angular/core/testing';

import { MentorBookingService } from './mentor-booking.service';

describe('MentorBookingService', () => {
  let service: MentorBookingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MentorBookingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
