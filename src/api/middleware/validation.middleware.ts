import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../../utils/errors';

/**
 * Express middleware that checks express-validator results and throws
 * a ValidationError if there are any failures.
 */
export function validationMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const details = errors.array().map((err) => {
            if ('path' in err) {
                return `${err.path}: ${err.msg}`;
            }
            return String(err.msg);
        });

        next(new ValidationError('Request validation failed', details));
        return;
    }

    next();
}
