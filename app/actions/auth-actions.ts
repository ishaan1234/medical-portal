"use server"

import { redirect } from 'next/navigation'
import { registerClinic, getAllClinics, getClinicById } from '@/lib/redis'

// Register a new clinic
export async function signup(formData: FormData): Promise<{ success: boolean; message: string; clinicId?: string }> {
  try {
    const name = formData.get('name') as string
    const address = formData.get('address') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const adminUsername = formData.get('adminUsername') as string
    const adminPassword = formData.get('adminPassword') as string
    
    if (!name || !adminUsername || !adminPassword) {
      return { 
        success: false, 
        message: 'Clinic name, admin username, and password are required' 
      }
    }
    
    // Register the clinic in Redis with admin credentials
    const clinic = await registerClinic({
      name,
      address,
      phone,
      email,
      adminUsername,
      adminPassword
    })
    
    return { 
      success: true, 
      message: 'Clinic registered successfully', 
      clinicId: clinic.id 
    }
  } catch (error) {
    console.error('Error registering clinic:', error)
    return { 
      success: false, 
      message: 'Failed to register clinic' 
    }
  }
}

// Get all clinics for the login dropdown
export async function getClinics() {
  try {
    const clinics = await getAllClinics()
    
    // If no clinics exist, return the default hardcoded ones for now
    if (clinics.length === 0) {
      return [
        { id: 'clinic1', name: 'City Health Center' },
        { id: 'clinic2', name: 'Community Medical Clinic' },
        { id: 'clinic3', name: 'Family Care Practice' }
      ]
    }
    
    // Return clinics without exposing sensitive data
    return clinics.map(clinic => ({
      id: clinic.id,
      name: clinic.name
    }))
  } catch (error) {
    console.error('Error getting clinics:', error)
    // Fallback to hardcoded clinics
    return [
      { id: 'clinic1', name: 'City Health Center' },
      { id: 'clinic2', name: 'Community Medical Clinic' },
      { id: 'clinic3', name: 'Family Care Practice' }
    ]
  }
}

// Default credentials for legacy clinics
const DEFAULT_CREDENTIALS = {
  clinic1: { doctor: { username: 'admin', password: 'admin123' }, receptionist: { username: 'admin', password: 'admin123' } },
  clinic2: { doctor: { username: 'admin', password: 'admin123' }, receptionist: { username: 'admin', password: 'admin123' } },
  clinic3: { doctor: { username: 'admin', password: 'admin123' }, receptionist: { username: 'admin', password: 'admin123' } }
}

export async function login(formData: FormData): Promise<{ success: boolean; message: string; redirectUrl?: string }> {
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const clinicId = formData.get('clinic') as string

  console.log(`Login attempt: Role: ${role}, Clinic: ${clinicId}, Username: ${username}`)

  if (!role || (role !== 'doctor' && role !== 'receptionist')) {
    return { success: false, message: 'Please select a valid role' }
  }

  if (!clinicId) {
    return { success: false, message: 'Please select a clinic' }
  }

  try {
    // Check if it's a registered clinic or default one
    if (clinicId.startsWith('clinic:')) {
      // Dynamic clinic - get from Redis
      console.log(`Fetching clinic data for ${clinicId}`)
      const clinic = await getClinicById(clinicId)
      
      if (!clinic) {
        console.log(`Clinic not found: ${clinicId}`)
        return { success: false, message: 'Clinic not found' }
      }
      
      console.log(`Found clinic: ${clinic.name}`)
      console.log(`Comparing credentials - Stored admin: ${clinic.adminUsername}`)
      
      // Both doctor and receptionist use the admin credentials for now
      if (username === clinic.adminUsername && password === clinic.adminPassword) {
        const redirectUrl = role === 'doctor' 
          ? `/doctor-dashboard?clinic=${clinicId}`
          : `/receptionist-dashboard?clinic=${clinicId}`
        
        console.log(`Login successful, redirecting to ${redirectUrl}`)
        // Return success with redirect URL  
        return { success: true, message: 'Login successful', redirectUrl }
      } else {
        console.log('Invalid credentials')
        return { success: false, message: 'Invalid credentials' }
      }
    } else {
      // Legacy hardcoded clinic
      console.log(`Using legacy credentials for ${clinicId}`)
      const defaultCredentials = DEFAULT_CREDENTIALS[clinicId as keyof typeof DEFAULT_CREDENTIALS]
      
      if (!defaultCredentials) {
        console.log(`Legacy clinic not found: ${clinicId}`)
        return { success: false, message: 'Clinic not found' }
      }
      
      const roleCredentials = defaultCredentials[role as keyof typeof defaultCredentials]
      
      if (username === roleCredentials.username && password === roleCredentials.password) {
        const redirectUrl = role === 'doctor' 
          ? `/doctor-dashboard?clinic=${clinicId}`
          : `/receptionist-dashboard?clinic=${clinicId}`
          
        console.log(`Legacy login successful, redirecting to ${redirectUrl}`)
        // Return success with redirect URL
        return { success: true, message: 'Login successful', redirectUrl }
      } else {
        console.log('Invalid legacy credentials')
        return { success: false, message: 'Invalid credentials' }
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, message: 'An error occurred during login' }
  }
}

// Simply redirect to home without cookie manipulation for now
export async function logout(): Promise<void> {
  redirect('/')
} 