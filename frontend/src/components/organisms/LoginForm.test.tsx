import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { LoginForm } from './LoginForm'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import apiClient from '@/lib/apiClient'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/lib/apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

describe('LoginForm', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
  })

  it('renders login form fields', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<LoginForm />)
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    expect(await screen.findByText(/Email Address is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/Password must be at least 6 characters long/i)).toBeInTheDocument()
  })

  it('authenticates user and redirects to dashboard for MEMBER role', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        token: 'member-jwt-token',
        role: 'MEMBER',
        user: { id: 'member-123', name: 'Budi Santoso', email: 'budi@test.com' },
      },
    })

    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'budi@test.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Member123!' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('member-jwt-token')
      expect(localStorage.getItem('role')).toBe('MEMBER')
      expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual({
        id: 'member-123',
        name: 'Budi Santoso',
        email: 'budi@test.com',
      })
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('authenticates admin and redirects to admin console for ADMIN role', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        token: 'admin-jwt-token',
        role: 'ADMIN',
        user: { id: 'admin-123', name: 'Admin', email: 'admin@test.com' },
      },
    })

    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'admin@test.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Admin123!' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('admin-jwt-token')
      expect(localStorage.getItem('role')).toBe('ADMIN')
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })

  it('shows error message on network failure', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network Error'))

    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'budi@test.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Member123!' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    expect(await screen.findByText(/Cannot connect to authentication service/i)).toBeInTheDocument()
  })

  it('shows API returned error message', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Invalid email or password',
        },
      },
    })

    render(<LoginForm />)
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'budi@test.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Member123!' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    expect(await screen.findByText(/Invalid email or password/i)).toBeInTheDocument()
  })
})
