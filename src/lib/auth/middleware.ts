// lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './jwt'

export async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return null
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  // Return the full decoded user info
  return decoded
}

export function withAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const user = await verifyAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Attach user to request
    ;(request as any).user = user

    return handler(request, ...args)
  }
}

export function withAdminAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const user = await verifyAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    return handler(request, ...args)
  }
}

export function withSuperAdminAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const user = await verifyAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - SuperAdmin access required' },
        { status: 403 }
      )
    }

    return handler(request, ...args)
  }
}