import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Stores } from './stores';
import { StoreService } from '../../services/store';
import { of, throwError } from 'rxjs';

const mockStoreService = {
  getStoreDetails: vi.fn(() => of({ name: 'Store', location: 'Location', opening_time: '10:00:00', closing_time: '18:00:00' })),
  updateStore: vi.fn(() => of({ name: 'Updated Store', location: 'New Location' })),
  validateUpdateData: vi.fn(() => null),
};

describe('Stores', () => {
  let component: Stores;
  let fixture: ComponentFixture<Stores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Stores, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: StoreService, useValue: mockStoreService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Stores);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('openModal shows modal', () => {
    component.openModal();
    expect(component.showModal()).toBe(true);
  });

  it('closeModal hides modal and clears file', () => {
    component.selectedFile = new File(['test'], 'test.txt');
    component.showModal.set(true);
    component.closeModal();
    expect(component.showModal()).toBe(false);
    expect(component.selectedFile).toBeNull();
  });

  it('onFileSelect sets selectedFile', () => {
    const file = new File(['test'], 'test.txt');
    const event = { target: { files: [file] } } as any;
    component.onFileSelect(event);
    expect(component.selectedFile).toBe(file);
  });

  it('onFileSelect handles empty files', () => {
    const event = { target: { files: [] } } as any;
    component.onFileSelect(event);
    expect(component.selectedFile).toBeNull();
  });


  it('formatTime converts time format', () => {
    expect(component.formatTime('10:30:45')).toBe('10:30');
  });

  it('formatTime handles empty time', () => {
    expect(component.formatTime('')).toBe('');
  });

  it('formatTime handles undefined time', () => {
    expect(component.formatTime(undefined)).toBe('');
  });
});
