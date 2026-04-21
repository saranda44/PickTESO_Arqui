// src/errors/app.error.ts
export class AppError extends Error {
    constructor(public message: string, public statusCode: number) {
        super(message);
        this.name = this.constructor.name;
    }
}