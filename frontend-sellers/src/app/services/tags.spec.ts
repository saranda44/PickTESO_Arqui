import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TagsService } from './tags';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

const mockAuthService = {
  getStoreId: () => '5',
  getToken: () => 'tok',
  getUserId: () => '1',
  getUserRole: () => 'seller',
  isLoggedIn: () => true,
};

describe('TagsService', () => {
  let service: TagsService;
  let httpMock: HttpTestingController;
  const base = environment.sellersApiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        TagsService,
      ],
    });
    service = TestBed.inject(TagsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('createTag() POSTs to /tags', () => {
    const tagData = { store_id: 5, name: 'Sale', color: '#ff0000', active: true } as any;
    service.createTag(tagData).subscribe();
    const req = httpMock.expectOne(`${base}/tags`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(tagData);
    req.flush({});
  });

  it('getTagsByStoreId() GETs /tags/store/{storeId}', () => {
    service.getTagsByStoreId(5).subscribe();
    const req = httpMock.expectOne(`${base}/tags/store/5`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getTagById() GETs /tags/{id}', () => {
    service.getTagById(3).subscribe();
    const req = httpMock.expectOne(`${base}/tags/3`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('updateTag() PUTs to /tags/{id}', () => {
    service.updateTag(3, { name: 'Updated' }).subscribe();
    const req = httpMock.expectOne(`${base}/tags/3`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('deleteTag() DELETEs /tags/{id}', () => {
    service.deleteTag(3).subscribe();
    const req = httpMock.expectOne(`${base}/tags/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'deleted' });
  });

  it('getTagsByProductId() GETs /products/{productId}/tags', () => {
    service.getTagsByProductId(7).subscribe();
    const req = httpMock.expectOne(`${base}/products/7/tags`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('updateProductTags() PUTs {tag_ids} to /products/{productId}/tags', () => {
    service.updateProductTags(7, [1, 2, 3]).subscribe();
    const req = httpMock.expectOne(`${base}/products/7/tags`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ tag_ids: [1, 2, 3] });
    req.flush({});
  });
});
