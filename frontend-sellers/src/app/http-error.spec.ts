import { TestBed } from '@angular/core/testing';

import { HttpError } from './http-error';

describe('HttpError', () => {
  let service: HttpError;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpError);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
