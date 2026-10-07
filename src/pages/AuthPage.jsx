import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './AuthPage.module.css'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const MODES = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  FORGOT: 'forgot',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LEN = 8

const STEPS = [
  { text: 'Create profile' },
  { text: 'Verify email' },
  { text: 'Start reading' },
]

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '' }

/* ------------------------------------------------------------------ */
/*  Validation                                                        */
/* ------------------------------------------------------------------ */

function validate(mode, form) {
  if (mode === MODES.SIGNUP && !form.firstName.trim()) {
    return 'First name is required'
  }
  if (!form.email.trim()) {
    return 'Email is required'
  }
  if (!EMAIL_RE.test(form.email.trim())) {
    return 'Enter a valid email address'
  }
  if (mode !== MODES.FORGOT) {
    if (!form.password) {
      return 'Password is required'
    }
    if (mode === MODES.SIGNUP && form.password.length < MIN_PASSWORD_LEN) {
      return `Password must be at least ${MIN_PASSWORD_LEN} characters`
    }
  }
  return ''
}

/* ------------------------------------------------------------------ */
/*  Supabase actions                                                  */
/* ------------------------------------------------------------------ */

async function signUpWithEmail(form) {
  const fullName = `${form.firstName} ${form.lastName}`.trim()
  const { error } = await supabase.auth.signUp({
    email: form.email.trim(),
    password: form.password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw error
}

async function signInWithEmail(form) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: form.email.trim(),
    password: form.password,
  })
  if (error) throw error
  return data.user
}

async function sendResetEmail(form) {
  const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim())
  if (error) throw error
}

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })
  if (error) throw error
}

/* ------------------------------------------------------------------ */
/*  Small presentational pieces                                       */
/* ------------------------------------------------------------------ */

function StepItem({ number, text, active }) {
  return (
    <div className={`${styles.stepItem} ${active ? styles.stepActive : styles.stepInactive}`}>
      <div className={`${styles.stepNum} ${active ? styles.stepNumActive : styles.stepNumInactive}`}>
        {number}
      </div>
      <span className={styles.stepText}>{text}</span>
    </div>
  )
}

function InputGroup({ label, placeholder, type = 'text', value, onChange, onKeyDown, rightEl, autoFocus }) {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.inputLabel}>{label}</label>
      <div className={styles.inputWrap}>
        <input
          className={styles.input}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
        />
        {rightEl && <div className={styles.inputRight}>{rightEl}</div>}
      </div>
    </div>
  )
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export default function AuthPage({ onClose, onAuth }) {
  const [mode, setMode] = useState(MODES.LOGIN)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  const updateField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      // Browser redirects to Google now — keep the button in a loading state.
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    const validationError = validate(mode, form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      if (mode === MODES.SIGNUP) {
        await signUpWithEmail(form)
        setSuccess('Account created! Check your email to verify.')
      } else if (mode === MODES.LOGIN) {
        const user = await signInWithEmail(form)
        onAuth(user)
        onClose()
        return
      } else {
        await sendResetEmail(form)
        setSuccess('Reset link sent to your email!')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEnterKey = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const title =
    mode === MODES.SIGNUP ? 'Create New Profile' : mode === MODES.LOGIN ? 'Welcome Back' : 'Reset Password'

  const subtitle =
    mode === MODES.SIGNUP
      ? 'Input your basic details to begin the journey.'
      : mode === MODES.LOGIN
      ? 'Sign in to continue your reading journey.'
      : 'Enter your email to receive a reset link.'

  const submitLabel =
    mode === MODES.SIGNUP ? 'Create Account' : mode === MODES.LOGIN ? 'Sign In' : 'Send Reset Link'

  const showSocialLogin = mode === MODES.LOGIN || mode === MODES.SIGNUP

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${visible ? styles.modalVisible : ''}`}>
        {/* LEFT PANEL */}
        <div className={styles.leftPanel}>
          <div className={styles.leftTop}>
            <div className={styles.brandMark}>
              <img src="/logo.jpg" alt="The Pagecraft" className={styles.brandLogo} />
              <span>The Pagecraft</span>
            </div>
            <h2 className={styles.leftHeadline}>
              Begin your
              <br />
              reading
              <br />
              <em>journey.</em>
            </h2>
            <p className={styles.leftSub}>
              Join thousands of readers exploring India's untold history, politics, and nature.
            </p>
          </div>

          <div className={styles.stepsSection}>
            {STEPS.map((s, i) => (
              <StepItem key={s.text} number={i + 1} text={s.text} active={i === 0} />
            ))}
          </div>

          <div className={styles.leftQuote}>
            <div className={styles.quoteBar} />
            <p>"Every book is a new world waiting to be discovered."</p>
            <span>— Ritesh Sharma</span>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className={styles.rightPanel}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>

          <div className={`${styles.formWrap} ${visible ? styles.formWrapVisible : ''}`}>
            <div className={styles.formHeader}>
              <h3 className={styles.formTitle}>{title}</h3>
              <p className={styles.formSub}>{subtitle}</p>
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}
            {success && <div className={styles.successBox}>{success}</div>}

            {showSocialLogin && (
              <>
                <button
                  type="button"
                  className={styles.googleBtn}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className={styles.divider}>
                  <div className={styles.dividerLine} />
                  <span className={styles.dividerText}>or continue with email</span>
                  <div className={styles.dividerLine} />
                </div>
              </>
            )}

            <div className={styles.fields}>
              {mode === MODES.SIGNUP && (
                <div className={styles.nameGrid}>
                  <InputGroup
                    label="First Name"
                    placeholder="Ritesh"
                    value={form.firstName}
                    onChange={updateField('firstName')}
                    autoFocus
                  />
                  <InputGroup
                    label="Last Name"
                    placeholder="Sharma"
                    value={form.lastName}
                    onChange={updateField('lastName')}
                  />
                </div>
              )}

              <InputGroup
                label="Email Address"
                placeholder="you@example.com"
                type="email"
                value={form.email}
                onChange={updateField('email')}
                onKeyDown={mode === MODES.FORGOT ? handleEnterKey : undefined}
                autoFocus={mode !== MODES.SIGNUP}
              />

              {mode !== MODES.FORGOT && (
                <div>
                  <InputGroup
                    label="Password"
                    placeholder="••••••••"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={updateField('password')}
                    onKeyDown={handleEnterKey}
                    rightEl={
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowPass((s) => !s)}
                        aria-label="Toggle password visibility"
                      >
                        <EyeIcon open={showPass} />
                      </button>
                    }
                  />
                  {mode === MODES.SIGNUP && (
                    <p className={styles.passHelper}>Requires at least {MIN_PASSWORD_LEN} characters.</p>
                  )}
                </div>
              )}

              {mode === MODES.LOGIN && (
                <button type="button" className={styles.forgotLink} onClick={() => switchMode(MODES.FORGOT)}>
                  Forgot password?
                </button>
              )}
            </div>

            <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : submitLabel}
            </button>

            <p className={styles.footerLink}>
              {mode === MODES.SIGNUP && (
                <>
                  Member already?{' '}
                  <button type="button" onClick={() => switchMode(MODES.LOGIN)}>
                    Log in
                  </button>
                </>
              )}
              {mode === MODES.LOGIN && (
                <>
                  New here?{' '}
                  <button type="button" onClick={() => switchMode(MODES.SIGNUP)}>
                    Create account
                  </button>
                </>
              )}
              {mode === MODES.FORGOT && (
                <>
                  Remembered it?{' '}
                  <button type="button" onClick={() => switchMode(MODES.LOGIN)}>
                    Back to sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
