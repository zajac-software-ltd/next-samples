import {  getUserById } from "@/app/services/user";
import { notFound } from "next/navigation";
import { userAction } from "@/app/users-with-suspense/actions";
import { Suspense, use } from "react";
import PageLoaderDefault from "@/app/components/page-loader-default";
import UserForm from "./user-details";


type Params = Promise<{ id: string }> // slug for dynamic routes is a string

async function Page({ params }: { params: Params }) {
    const id = (await params).id;

    if (id !== "new" && isNaN(+id)) return notFound();

    return (
        <Suspense fallback={<PageLoaderDefault />}>
            <PageContent id={id} />
        </Suspense>
    )
}

function PageContent({ id }: { id: string }) {

    const result = id === "new" ? null : use(getUserById({ id: +id })) 

    if (result?.error) {
        // If it's a 404, not found, we can use Next.js built-in handler, or some custom "user not fount" message. 
        if (result.error.statusCode === 404) {
            return notFound();
        }
        //  If neccasary, show detailed error info for debugging or logging
        return <div>{JSON.stringify(result.error)}</div>
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground px-4 py-8">
            <div className="mx-auto w-full max-w-2xl bg-card text-card-foreground shadow-md rounded-xl border border-border p-2 md:p-4">
                <UserForm user={result?.payload} userAction={userAction} />
            </div>
        </div>
    )
}

export default Page;
