import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabaseServer'
import { verifyToken } from '@/lib/auth/jwt'
import { updateUserSchema } from '@/lib/auth/schemas'

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    console.log('=== DEBUG PROFILE UPDATE ===')
    console.log('Decoded token ID:', decoded.id)
    console.log('Full decoded:', decoded)

    const body = await request.json()
    
    const validatedData = updateUserSchema.parse({
      name: body.name,
      phone: body.phone,
      address: body.address,
    })

    console.log('Validated data:', validatedData)

    const supabase = await createAdminClient()
    
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    console.log('Connection test:', { testData, testError })

    // List ALL users to see what's in the table
    const { data: allUsers, error: listError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    console.log('All users (20 latest):', allUsers)
    console.log('List error:', listError)

    if (listError) {
      console.error('Failed to list users:', listError)
      throw listError
    }

    // Check if the user ID exists
    const userExists = allUsers?.some(user => user.id === decoded.id)
    console.log(`User ${decoded.id} exists in list?`, userExists)

    if (!userExists) {
      console.log('Available user IDs:', allUsers?.map(u => u.id))
      return NextResponse.json(
        { error: `User ID ${decoded.id} not found in users table` },
        { status: 404 }
      )
    }

    // Try to get the specific user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', decoded.id)
      .maybeSingle()

    console.log('Direct user query:', { userData, userError })

    if (userError) {
      console.error('User query error:', userError)
      throw userError
    }

    if (!userData) {
      console.error('User data is null after successful query')
      return NextResponse.json(
        { error: 'User data retrieval failed' },
        { status: 500 }
      )
    }

    console.log('Proceeding with update for user:', userData.email)

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        name: validatedData.name,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', decoded.id)
      .select('id, email, name, phone, address, role, status, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    console.log('Update successful! New data:', updatedUser)

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        status: updatedUser.status,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      },
    })

  } catch (error: any) {
    console.error('=== PROFILE UPDATE ERROR ===', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Update failed' },
      { status: 500 }
    )
  }
}