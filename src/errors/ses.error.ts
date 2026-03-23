import { AppError } from './app.error';

export class SESError extends AppError {
  constructor(message: string) {
    super(message, 502); // 502 Bad Gateway — fallo de servicio externo
  }
}