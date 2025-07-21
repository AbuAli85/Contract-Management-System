'use server'

import { cookies } from 'next/headers'
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

interface CookieOptions {
  maxAge?: number
  expires?: Date
  path?: string
  domain?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

export async function setCookie(name: string, value: string, options: CookieOptions = {}) {
  const cookieStore = await Promise.resolve(cookies())
  cookieStore.set({
    name,
    value,
    path: options.path ?? '/',
    sameSite: options.sameSite ?? 'lax',
    secure: process.env.NODE_ENV === 'production' || options.secure,
    ...options,
  })
}

export async function removeCookie(name: string) {
  const cookieStore = await Promise.resolve(cookies())
  cookieStore.delete(name)
}

export async function getCookie(name: string): Promise<string | undefined> {
  const cookieStore = await Promise.resolve(cookies())
  const cookie: RequestCookie | undefined = cookieStore.get(name)
  return cookie?.value
}
