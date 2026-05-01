import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert';

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [AlertService] });
    service = TestBed.inject(AlertService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('showError() adds item with type error', () => {
    service.showError('Something failed');
    const alerts = service.alerts();
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('error');
    expect(alerts[0].message).toBe('Something failed');
  });

  it('showSuccess() adds item with type success', () => {
    service.showSuccess('All good');
    expect(service.alerts()[0].type).toBe('success');
  });

  it('showInfo() adds item with type info', () => {
    service.showInfo('FYI');
    expect(service.alerts()[0].type).toBe('info');
  });

  it('multiple calls produce incrementing ids', () => {
    service.showError('first');
    service.showError('second');
    const alerts = service.alerts();
    expect(alerts[0].id).toBe('alert-1');
    expect(alerts[1].id).toBe('alert-2');
  });

  it('alert is auto-removed after duration', () => {
    service.showError('temp', 1000);
    expect(service.alerts().length).toBe(1);
    vi.advanceTimersByTime(1001);
    expect(service.alerts().length).toBe(0);
  });

  it('alert stays before duration elapses', () => {
    service.showError('temp', 3000);
    vi.advanceTimersByTime(2999);
    expect(service.alerts().length).toBe(1);
  });

  it('removeAlert() removes matching item immediately', () => {
    service.showError('msg', 5000);
    const id = service.alerts()[0].id;
    service.removeAlert(id);
    expect(service.alerts().length).toBe(0);
  });

  it('clear() empties all alerts', () => {
    service.showError('a', 5000);
    service.showSuccess('b', 5000);
    service.clear();
    expect(service.alerts().length).toBe(0);
  });

  it('custom duration is respected for auto-remove', () => {
    service.showError('quick', 500);
    vi.advanceTimersByTime(500);
    expect(service.alerts().length).toBe(0);
  });
});
