import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpErrorHandler {

  handle(err: any, contextName: string = 'Error') {
    const message = err.error?.message || err.statusText || `${contextName} desconocido`;
    return throwError(() => new Error(message));
  }
}

