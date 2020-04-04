import { TestBed } from '@angular/core/testing';

import { CurrentPageService } from './current-page.service';

describe('CurrentPageService', () => {
  let service: CurrentPageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurrentPageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
