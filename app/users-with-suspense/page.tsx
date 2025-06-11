import { findUsers } from "@/app/services/user";
import Link from "next/link";
import PageLoaderDefault from "../components/page-loader-default";
import { Suspense, use } from "react";

async function Page() {
    return (
        <Suspense fallback={<PageLoaderDefault />}>
            <PageContent />
        </Suspense>
    )
}

function PageContent() {
    const resp = use(findUsers());
    if (resp.error) {
        return <div>{JSON.stringify(resp.error)}</div>
    }
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground px-4 py-8">
            <div className="mx-auto w-full max-w-2xl bg-card text-card-foreground shadow-md rounded-xl border border-border p-2 md:p-4">
                <div className="w-full flex flex-col space-y-2 ">
                    {resp.payload?.length ?
                        <>
                            <div className="flex flex-row justify-between">
                                Users:
                                <Link shallow href="/users-with-suspense/new">
                                    Add User
                                </Link>
                            </div>
                            {resp.payload?.map(({ id, name, email }) => (
                                <Link key={id} href={`/users-with-suspense/${id}`}>
                                    {`${id}. ${name}, ${email}`}
                                </Link>
                            ))}
                        </> : <div>No users yet</div>
                    }
                </div>
            </div>
        </div>
    )
}


export default Page;
