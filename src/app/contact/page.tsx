'use client'

import './contact.css'
import Navigation from '@/components/Navigation'
import { useState, FormEvent, useEffect, useRef } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function ContactPage() {
  const [isReady, setIsReady] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    email: '',
    message: '',
  })
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  // Handle modal open/close
  const openModal = () => {
    dialogRef.current?.showModal()
  }

  const closeModal = () => {
    dialogRef.current?.close()
  }

  const validateForm = () => {
    const errors = {
      name: '',
      email: '',
      message: '',
    }

    // Validate name (min 2 characters)
    if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }

    // Validate email
    const emailRegex = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*.)+[A-Za-z]{2,}$/
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    // Validate message (min 10 characters)
    if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters'
    }

    setValidationErrors(errors)
    return !errors.name && !errors.email && !errors.message
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Validate before submitting
    if (!validateForm()) {
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
        setValidationErrors({ name: '', email: '', message: '' })
        // Close modal after 2 seconds on success
        setTimeout(() => {
          closeModal()
          setStatus('idle')
        }, 2000)
      } else {
        setStatus('error')
        setErrorMessage(data.error || 'Failed to send message')
      }
    } catch (error) {
      Sentry.captureException(error)
      Sentry.logger.error('Contact form submission error', {
        error: error instanceof Error ? error.message : String(error)
      })
      setStatus('error')
      setErrorMessage('Network error. Please try again.')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors({ ...validationErrors, [field]: '' })
    }
  }

  return (
    <div className="layout">
      <Navigation />
      <div id="container" className="contact-container ie" style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
        <div className="post contact-post">
          <div className="info">
            <div className="title section">Contact</div>
            <div className="clear"></div>
          </div>

          <div className="content">
            <p>
              <strong>Tel:</strong> +15094056458
            </p>
            
            <p>
              <strong>Email:</strong> andrxwliu@gmail.com / aliu458@gatech.edu
            </p>
            
            {/* <p>
              <strong>Instagram:</strong> andweez
            </p> */}

            <p>
              <strong>GitHub:</strong> aandrx
            </p>

            <div style={{ marginTop: '40px' }}>
              <button
                onClick={openModal}
                style={{
                  padding: '10px 20px',
                  fontSize: '8pt',
                  fontFamily: 'helvetica, arial, sans-serif',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Send me a message
              </button>
            </div>

            {/* Native Dialog Modal */}
            <dialog
              ref={dialogRef}
              style={{
                padding: '30px',
                borderRadius: '4px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                border: 'none',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px 10px',
                }}
              >
                ×
              </button>

              <h2 id="modal-title" style={{ marginTop: 0, marginBottom: '20px', fontSize: '14pt', fontFamily: 'helvetica, arial, sans-serif' }}>
                Contact Form
              </h2>

                  <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                      <input
                        type="text"
                        placeholder="Name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '8px',
                          fontSize: '8pt',
                          fontFamily: 'helvetica, arial, sans-serif',
                          border: `1px solid ${validationErrors.name ? '#d32f2f' : '#e5e5e5'}`,
                          boxSizing: 'border-box',
                        }}
                      />
                      {validationErrors.name && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '7pt', color: '#d32f2f' }}>
                          {validationErrors.name}
                        </p>
                      )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '8px',
                          fontSize: '8pt',
                          fontFamily: 'helvetica, arial, sans-serif',
                          border: `1px solid ${validationErrors.email ? '#d32f2f' : '#e5e5e5'}`,
                          boxSizing: 'border-box',
                        }}
                      />
                      {validationErrors.email && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '7pt', color: '#d32f2f' }}>
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <input
                        type="text"
                        placeholder="Subject (optional)"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          fontSize: '8pt',
                          fontFamily: 'helvetica, arial, sans-serif',
                          border: '1px solid #e5e5e5',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <textarea
                        placeholder="Message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        required
                        rows={6}
                        style={{
                          width: '100%',
                          padding: '8px',
                          fontSize: '8pt',
                          fontFamily: 'helvetica, arial, sans-serif',
                          border: `1px solid ${validationErrors.message ? '#d32f2f' : '#e5e5e5'}`,
                          boxSizing: 'border-box',
                          resize: 'vertical',
                        }}
                      />
                      {validationErrors.message && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '7pt', color: '#d32f2f' }}>
                          {validationErrors.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      style={{
                        padding: '10px 20px',
                        fontSize: '8pt',
                        fontFamily: 'helvetica, arial, sans-serif',
                        backgroundColor: status === 'loading' ? '#ccc' : '#000',
                        color: '#fff',
                        border: 'none',
                        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        width: '100%',
                      }}
                    >
                      {status === 'loading' ? 'Sending...' : 'Send Message'}
                    </button>

                    {status === 'success' && (
                      <p style={{ marginTop: '16px', color: '#2e7d32', textAlign: 'center' }}>
                        Message sent successfully! I'll get back to you soon.
                      </p>
                    )}

                    {status === 'error' && (
                      <p style={{ marginTop: '16px', color: '#d32f2f', textAlign: 'center' }}>
                        {errorMessage}
                      </p>
                    )}
                  </form>
                </dialog>
          </div>
        </div>

        <div className="tracer"></div>
        <div className="clear"></div>
      </div>
    </div>
  )
}
