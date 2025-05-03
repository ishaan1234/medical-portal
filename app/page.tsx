import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-purple-500 p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-900">MediPortal</span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Welcome to MediPortal</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">Secure access to our healthcare management system</p>
        </div>

        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
          <Link
            href="/login"
            className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md block"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-purple-100 p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-600"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-semibold text-gray-900">Clinic Login</h2>
              <p className="mb-4 text-gray-600">
                Access your clinic portal with your role-specific credentials
              </p>
              <span className="flex items-center text-purple-600 transition-transform group-hover:translate-x-1">
                Login <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-purple-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
          </Link>

          <Link
            href="/signup"
            className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md block"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-green-100 p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-600"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" x2="19" y1="8" y2="14" />
                  <line x1="22" x2="16" y1="11" y2="11" />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-semibold text-gray-900">Register Clinic</h2>
              <p className="mb-4 text-gray-600">
                Sign up for a new clinic account to access our platform
              </p>
              <span className="flex items-center text-green-600 transition-transform group-hover:translate-x-1">
                Sign Up <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-green-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
          </Link>
        </div>
      </main>

      <footer className="border-t bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} MediPortal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
