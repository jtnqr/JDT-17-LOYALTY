import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { RegisterForm } from './RegisterForm'
import { useRouter } from 'next/navigation'
import axios from 'axios'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('axios')

describe('RegisterForm', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
  })

  it('renders register fields', () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument()
  })

  it('validates empty inputs and checkbox requirement', async () => {
    render(<RegisterForm />)
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }))

    expect(await screen.findByText(/Full Name is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/Email Address is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/Phone Number is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/You must agree to the Terms of Service/i)).toBeInTheDocument()
  })

  it('validates password match', async () => {
    render(<RegisterForm />)
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Budi Santoso' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'budi@test.com' } })
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '81234567890' } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: 'Member123!' } })
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: 'DifferentPass123!' } })
    fireEvent.click(screen.getByLabelText(/I agree/i))
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }))

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument()
  })

  it('normalizes phone and registers member successfully', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        token: 'registered-jwt-token',
        role: 'MEMBER',
        user: { id: 'member-123', name: 'Budi Santoso', email: 'budi@test.com', phone: '081234567890' },
      },
    })

    render(<RegisterForm />)
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Budi Santoso' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'budi@test.com' } })
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '81234567890' } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: 'Member123!' } })
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: 'Member123!' } })
    fireEvent.click(screen.getByLabelText(/I agree/i))
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', {
        name: 'Budi Santoso',
        email: 'budi@test.com',
        phone: '081234567890',
        password: 'Member123!',
      })
      expect(localStorage.getItem('token')).toBe('registered-jwt-token')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('normalizes +62 phone numbers properly', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { token: 'token', role: 'MEMBER', user: {} },
    })

    render(<RegisterForm />)
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Budi Santoso' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'budi@test.com' } })
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '6281234567890' } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: 'Member123!' } })
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: 'Member123!' } })
    fireEvent.click(screen.getByLabelText(/I agree/i))
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', expect.objectContaining({
        phone: '081234567890',
      }))
    })
  })

  it('displays API errors on registration fail', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Phone number already registered',
        },
      },
    })

    render(<RegisterForm />)
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Budi Santoso' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'budi@test.com' } })
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '81234567890' } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: 'Member123!' } })
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: 'Member123!' } })
    fireEvent.click(screen.getByLabelText(/I agree/i))
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }))

    expect(await screen.findByText(/Phone number already registered/i)).toBeInTheDocument()
  })

  it('displays connection error on network failure', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('Network Error'))

    render(<RegisterForm />)
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Budi Santoso' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'budi@test.com' } })
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '81234567890' } })
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: 'Member123!' } })
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: 'Member123!' } })
    fireEvent.click(screen.getByLabelText(/I agree/i))
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }))

    expect(await screen.findByText(/Cannot connect to registration service/i)).toBeInTheDocument()
  })
})
