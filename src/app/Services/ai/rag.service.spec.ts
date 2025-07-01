import { TestBed } from '@angular/core/testing';

import { RagService } from './rag.service';

describe('RagService', () => {
  let service: RagService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RagService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
