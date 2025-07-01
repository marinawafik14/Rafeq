import { TestBed } from '@angular/core/testing';

import { AiStorageService } from './ai-storage.service';

describe('AiStorageService', () => {
  let service: AiStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
