// Extends Express request typing for the ID added by requestId middleware.
declare global {
    namespace Express {
        interface Request {
            requestId: string;
        }
    }
}

export {};