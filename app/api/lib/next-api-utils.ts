import { ServiceResult } from "@/app/services/service-utils";
import { NextResponse } from "next/server";

export async function handleResponse(pendingResult: Promise<ServiceResult<any>>) {
    const res = await pendingResult;
    if ("error" in res) {
        if (res.payload == null) {
            return NextResponse.json(
                { error: res.error },
                { status: res.error.statusCode || 500 }
            )
        }
    }
    return NextResponse.json(res.payload);
}

