"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class customError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.isAlreadyHandled = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
;
exports.default = customError;
