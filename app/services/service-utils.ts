type UnmanagedError = {
    status: string,
    code: string,
    title: string,
    detail: string
}

export type ServiceResult<T> =
    | {
        error: { statusCode: number; message?: string, errors?: UnmanagedError[] },
        payload: never
    }
    | {
        payload: T,
        error: never
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

export function withErrorHandler<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>
): (...args: T) => Promise<ServiceResult<R>> {
    return async (...args: T): Promise<ServiceResult<R>> => {
        try {
            const payload = await fn(...args);
            return { payload, error: undefined as never };
        } catch (error) {
            const { statusCode, message } = error as ServicesError;

            const errorsInfo: { statusCode: number } & { [key: string]: unknown } = { statusCode: statusCode ?? 500 };
            try {
                Object.entries(JSON.parse(message)).forEach(([key, value]) => {
                    errorsInfo[key] = value;
                });
            } catch {
                errorsInfo.message = message;
            }

            return {
                error: errorsInfo as { statusCode: number; message?: string, errors?: UnmanagedError[] },
                payload: undefined as never
            };
        }
    };
}

export function withDelay<T extends (...args: never) => unknown>(
    fn: T,
    delay: number
): T extends (...args: infer P) => infer R ? (...args: P) => Promise<Awaited<R>> : never;
export function withDelay(
    fn: (...args: unknown[]) => unknown,
    delay: number
): (...args: unknown[]) => Promise<unknown> {
    return async (...args: unknown[]): Promise<unknown> => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return await fn(...args);
    };
}


export function serviceWrapper<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>
  ): (...args: T) => Promise<ServiceResult<R>> {
    let wrapped: (...args: T) => Promise<ServiceResult<R>> = withErrorHandler(fn);

    if (process.env.THROTTLE) {
      const ms = parseInt(process.env.THROTTLE, 10) || 0;
      wrapped = withDelay(wrapped, ms);
    }
    
    return wrapped;
  }
