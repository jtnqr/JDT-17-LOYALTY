import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAdmin } from './useAdmin'
import { useRouter } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

describe('useAdmin', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
  })

  it('redirects to login when credentials missing', () => {
    const { result } = renderHook(() => useAdmin())
    expect(mockPush).toHaveBeenCalledWith('/login')
    expect(result.current.isLoaded).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('loads admin user info when valid credentials exist', () => {
    localStorage.setItem('token', 'valid-token')
    localStorage.setItem('role', 'ADMIN')
    localStorage.setItem('user', JSON.stringify({
      id: 'admin-id',
      name: 'Admin User',
      email: 'admin@test.com',
      status: 'ACTIVE',
    }))

    const { result } = renderHook(() => useAdmin())
    expect(mockPush).not.toHaveBeenCalled()
    expect(result.current.isLoaded).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.adminId).toBe('admin-id')
    expect(result.current.admin).toEqual({
      id: 'admin-id',
      name: 'Admin User',
      email: 'admin@test.com',
      status: 'ACTIVE',
    })
  })

  it('redirects to login on wrong role', () => {
    localStorage.setItem('token', 'valid-token')
    localStorage.setItem('role', 'MEMBER')
    localStorage.setItem('user', JSON.stringify({ id: '1' }))

    renderHook(() => useAdmin())
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('performs logout and clears localStorage', () => {
    localStorage.setItem('token', 'valid-token')
    localStorage.setItem('role', 'ADMIN')
    localStorage.setItem('user', JSON.stringify({ id: '1' }))

    const { result } = renderHook(() => useAdmin())
    act(() => {
      result.current.logout()
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('role')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})
