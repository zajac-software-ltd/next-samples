export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white">403</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            You don&apos;t have permission to access this resource.
          </p>
        </div>
      </div>
    </div>
  )
}
