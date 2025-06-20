import { TestBed } from '@angular/core/testing';

import { SignalrChatService } from './signalr-chat.service';

describe('SignalrChatService', () => {
  let service: SignalrChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignalrChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
