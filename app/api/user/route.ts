import { NextResponse } from "next/server";
import { addUser, findUsers } from "@/app/services/user";
import { handleResponse } from "../lib/next-api-utils";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    return handleResponse(findUsers({
        name: searchParams.getAll("name"),
        id: searchParams.getAll("id"),
        email: searchParams.getAll("email"),
        phone: searchParams.getAll("phone")
    }));
}

export async function POST(req: Request) {
    const data = await req.json();
    const res = await addUser(data);
    if (res.error) {
        return NextResponse.json(res.error);
    }
    return NextResponse.json(res.payload);
}
