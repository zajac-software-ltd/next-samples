import { ServiceResult } from "@/app/services/service-utils";
import { NextResponse } from "next/server";

export async function handleResponse<T>(pendingResult: Promise<ServiceResult<T>>) {
    const res = await pendingResult;
    if (res.error) {
        return NextResponse.json(
            { error: res.error },
            { status: res.error?.statusCode || 500 }
        )
    }
    return NextResponse.json(res.payload);
}

