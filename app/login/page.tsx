"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { login, getClinics } from "@/app/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

// Define a type for clinics
interface ClinicItem {
  id: string;
  name: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [clinics, setClinics] = useState<ClinicItem[]>([])
  const [error, setError] = useState("")

  // Fetch clinics on client side
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const data = await getClinics()
        setClinics(data)
      } catch (error) {
        console.error("Error fetching clinics:", error)
      }
    }
    
    fetchClinics()
  }, [])

  async function handleLogin(formData: FormData) {
    setError("")
    setLoading(true)
    
    try {
      const result = await login(formData)
      
      if (result.success) {
        // Successful login
        toast({
          title: "Login Successful",
          description: result.message,
          className: "border-green-200 bg-green-50 text-green-800",
        })
        
        // Redirect to the appropriate dashboard
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl
        }
      } else {
        // Failed login
        setError(result.message)
        toast({
          title: "Login Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An unexpected error occurred")
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
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
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Clinic Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the portal
            </CardDescription>
          </CardHeader>
          <form action={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
                  {error}
                </div>
              )}
            
              <div className="space-y-2">
                <Label htmlFor="clinic">Clinic</Label>
                <Select name="clinic" defaultValue={clinics.length > 0 ? clinics[0].id : "clinic1"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="doctor">
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  name="username" 
                  type="text" 
                  placeholder="username" 
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-sm text-purple-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
              
              <div className="text-center text-sm">
                Need to register your clinic?{" "}
                <Link href="/signup" className="text-purple-600 hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>

      <footer className="border-t bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} MediPortal. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/" className="text-purple-600 hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
} 