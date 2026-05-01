import { TestBed } from '@angular/core/testing';
import { HttpErrorHandler } from './http-error';

describe('HttpErrorHandler', () => {
  let handler: HttpErrorHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [HttpErrorHandler] });
    handler = TestBed.inject(HttpErrorHandler);
  });

  it('uses error.message from response body', () => {
    let caught: Error | undefined;
    handler.handle({ error: { message: 'Not found' } }, 'Ctx').subscribe({
      error: (e) => caught = e,
    });
    expect(caught?.message).toBe('Not found');
  });

  it('falls back to statusText when no error.message', () => {
    let caught: Error | undefined;
    handler.handle({ statusText: 'Bad Request' }, 'Ctx').subscribe({
      error: (e) => caught = e,
    });
    expect(caught?.message).toBe('Bad Request');
  });

  it('falls back to contextName + desconocido when no message or statusText', () => {
    let caught: Error | undefined;
    handler.handle({}, 'Inventario').subscribe({
      error: (e) => caught = e,
    });
    expect(caught?.message).toBe('Inventario desconocido');
  });
});
