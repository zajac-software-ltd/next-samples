type UnmanagedError = {
    status: string,
    code: string,
    title: string,
    detail: string
}

export type ServiceResult<T> =
    | {
        error: { statusCode: number; message?: string, errors?: UnmanagedError[] },
    }
    | {
        payload: T,
        error: null
    };

export class ServicesError extends Error {
    statusCode?: number;
    constructor(name: string = 'ServicesError', statusCode?: number, message?: string) {
        super(message);
        this.name = name;
        this.statusCode = statusCode;
    }
}

export class NotFoundError extends ServicesError {
    constructor(message?: string) {
        super("NotFoundError", 404, message || "Resource not found")
    }
}



export function withErrorHandler<T extends any[], R>(
    fn: (...args: T) => Promise<R>
): (...args: T) => Promise<ServiceResult<R>> {
    return async (...args: T): Promise<ServiceResult<R>> => {
        try {
            const payload = await fn(...args);
            return { payload, error: null };
        } catch (error) {
            const { statusCode, message } = error as ServicesError;

            const errorsInfo: { statusCode: number } & { [key: string]: unknown } = { statusCode: statusCode ?? 500 };
            try {
                Object.entries(JSON.parse(message)).forEach(([key, value]) => {
                    errorsInfo[key] = value;
                });
            } catch (_) {
                errorsInfo.message = message;
            }

            return {
                error: errorsInfo
            };
        }
    };
}

export function withDelay<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
    return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fn(...args);
    };
}


export function serviceWrapper<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ): (...args: T) => Promise<ServiceResult<R>> {
    let wrapped: (...args: T) => Promise<ServiceResult<R>> = withErrorHandler(fn);

    if (process.env.THROTTLE) {
      const ms = parseInt(process.env.THROTTLE, 10) || 0;
      wrapped = withDelay(wrapped, ms);
    }
    
    return wrapped;
  }