import { CLE } from "./client-component-example";

// In Next.js 15, both `params` and `searchParams` are promises in server components
type Params = Promise<{ slug: string[] }> // for catch-all routes ([[...slug]]) slug is an array of strings
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function Home({ params, searchParams }: { params: Params, searchParams: SearchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  return (
    <div className="w-full flex justify-center pt-4">
      <div className="w-fit space-y-2 text-center border border-gray-300 p-4 rounded">
        <div className="font-semibold text-lg">Catch All Route Example</div>
        <div>Slug(s): {JSON.stringify(resolvedParams.slug)}</div>
        <div>Search Params: {JSON.stringify(resolvedSearchParams)}</div>
        <div>
          <CLE />
        </div>
      </div>
    </div>
  );
}
