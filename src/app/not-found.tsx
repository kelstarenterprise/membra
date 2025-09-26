import Link from 'next/link'
import { Button } from '@/components/ui/button'
 
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
          <h1 className="text-6xl font-bold mb-4">404</h1>
        </div>
        <h2 className="text-2xl font-semibold text-primary mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/dashboard">
              Return Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">
              Go to Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}