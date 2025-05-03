"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { signup } from "@/app/actions/auth-actions"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [registeredClinic, setRegisteredClinic] = useState<{ name: string; id: string } | null>(null)

  // Auto redirect to login page after successful registration
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;
    
    if (showConfirmation) {
      redirectTimer = setTimeout(() => {
        router.push("/login");
      }, 5000); // Redirect after 5 seconds
    }
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [showConfirmation, router]);

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const formValues = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        adminUsername: formData.get('adminUsername') as string,
        adminPassword: formData.get('adminPassword') as string,
      };
      
      console.log("Signing up with data:", formValues);
      const result = await signup(formData)
      
      console.log("Signup result:", result);
      
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: `${result.message}`,
          className: "border-green-200 bg-green-50 text-green-800",
          duration: 5000,
        })
        
        // Show confirmation dialog
        setRegisteredClinic({
          name: formValues.name,
          id: result.clinicId || ''
        });
        setShowConfirmation(true);
      } else {
        toast({
          title: "Registration Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error during signup:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  function handleConfirmationClose() {
    setShowConfirmation(false);
    router.push("/login");
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
            <CardTitle className="text-2xl font-bold text-center">Register Your Clinic</CardTitle>
            <CardDescription className="text-center">
              Enter your clinic details to create an account
            </CardDescription>
          </CardHeader>
          <form action={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Clinic Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  type="text" 
                  placeholder="Enter clinic name" 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  name="address" 
                  type="text" 
                  placeholder="Enter clinic address" 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    placeholder="Phone number" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="Email address" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminUsername">Admin Username</Label>
                <Input 
                  id="adminUsername" 
                  name="adminUsername" 
                  type="text" 
                  placeholder="Choose an admin username" 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input 
                  id="adminPassword" 
                  name="adminPassword" 
                  type="password" 
                  placeholder="Choose a secure password" 
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register Clinic"}
              </Button>
              
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-purple-600 hover:underline">
                  Login
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
      
      {/* Registration Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={(open) => {
        if (!open) handleConfirmationClose();
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registration Successful!</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                Your clinic <span className="font-semibold">{registeredClinic?.name}</span> has been registered successfully.
              </p>
              <p className="mb-4">
                Clinic ID: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{registeredClinic?.id}</span>
              </p>
              <p>
                You will be redirected to the login page in 5 seconds. Please use your admin credentials to log in.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleConfirmationClose}>
              Go to Login Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 