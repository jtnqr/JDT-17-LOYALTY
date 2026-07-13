import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMember } from './useMember'
import { useRouter } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

describe('useMember', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
  })

  it('redirects to login when credentials missing', () => {
    const { result } = renderHook(() => useMember())
    expect(mockPush).toHaveBeenCalledWith('/login')
    expect(result.current.isLoaded).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('loads member user info when valid credentials exist', () => {
    localStorage.setItem('token', 'valid-token')
    localStorage.setItem('role', 'MEMBER')
    localStorage.setItem('user', JSON.stringify({
      id: 'member-id',
      name: 'Member User',
      email: 'member@test.com',
      status: 'ACTIVE',
    }))

    const { result } = renderHook(() => useMember())
    expect(mockPush).not.toHaveBeenCalled()
    expect(result.current.isLoaded).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.memberId).toBe('member-id')
    expect(result.current.member).toEqual({
      id: 'member-id',
      name: 'Member User',
      email: 'member@test.com',
      status: 'ACTIVE',
    })
  })

  it('redirects to login on wrong role', () => {
    localStorage.setItem('token', 'valid-token')
    localStorage.setItem('role', 'ADMIN')
    localStorage.setItem('user', JSON.stringify({ id: '1' }))

    renderHook(() => useMember())
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('performs logout and clears localStorage', () => {
    localStorage.setItem('token', 'valid-token')
    localStorage.setItem('role', 'MEMBER')
    localStorage.setItem('user', JSON.stringify({ id: '1' }))

    const { result } = renderHook(() => useMember())
    act(() => {
      result.current.logout()
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('role')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})
