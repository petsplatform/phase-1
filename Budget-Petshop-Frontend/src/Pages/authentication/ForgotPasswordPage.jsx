import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import logo from '../../assets/Logo/footer-logo.png'
import petLoginImg from '../../assets/Authentication/loginbg.png'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const validateForm = () => {
    if (!email) {
      setError('Email address is required')
      return false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)

    // Simulate password recovery API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitSuccess(true)
    }, 1500)
  }

  return (
    <div className="flex min-h-screen bg-background font-sans lg:h-screen lg:overflow-hidden">
      {/* Back button (Top Left) */}
      <Link
        to="/login"
        className="absolute top-6 left-6 z-10 flex items-center gap-2 rounded-full border border-outline bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-charcoal-text backdrop-blur-md transition hover:border-secondary hover:text-secondary hover:shadow-sm"
      >
        <ArrowLeft size={14} />
        <span>Back to Login</span>
      </Link>

      {/* Split Screen Layout */}
      <div className="flex w-full lg:h-full">
        {/* Left Side: Illustration Pane */}
        <div className="relative hidden w-1/2 lg:block lg:h-full">
          <img
            src={petLoginImg}
            alt="Cute puppy and kitten"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/20 to-transparent" />

          <div className="absolute bottom-12 left-12 right-12 rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-lg shadow-2xl">
            <div className="flex items-center gap-2 text-white">
              <Sparkles size={20} className="text-accent animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Security First</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white font-display">
              We've Got You <br />Covered
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              Don't worry, forgetting passwords happens to the best of us. Rest assured your pet care profile and cart history are safe and secure. Let's get you back in!
            </p>
          </div>
        </div>

        {/* Right Side: Form Pane */}
        <div className="flex w-full items-center justify-center p-8 sm:p-12 lg:w-1/2 lg:h-full lg:overflow-y-auto">
          <div className="w-full max-w-md">

            {/* Logo and Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <Link to="/">
                <img
                  src={logo}
                  alt="Budget PetShop Logo"
                  className="h-24 w-auto object-contain mb-4 transition transform hover:scale-105"
                />
              </Link>
              <h1 className="text-2xl font-bold text-on-background font-display tracking-tight">
                Forgot Password?
              </h1>
              <p className="text-sm text-charcoal-text mt-1.5">
                No worries! Enter your email and we'll send a recovery link.
              </p>
            </div>

            {/* Success State */}
            {submitSuccess ? (
              <div className="rounded-3xl bg-white border border-outline p-8 text-center shadow-xl animate-fade-in-up">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-tint text-secondary mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-on-background font-display">Check your inbox</h3>
                <p className="text-sm text-charcoal-text mt-3 leading-relaxed">
                  We've sent a password reset link to <strong className="text-on-background">{email}</strong>. Please follow the instructions in the email to regain access.
                </p>
                <div className="mt-8 pt-6 border-t border-outline flex flex-col gap-3">
                  <p className="text-xs text-charcoal-text/80">
                    Didn't receive the email? Check your spam folder or try again in a few minutes.
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="text-sm font-semibold text-secondary hover:text-secondary/85 hover:underline"
                  >
                    Resend link
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-charcoal-text/60">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      placeholder="e.g., alex@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                      }}
                      className={`w-full rounded-2xl border bg-white py-3.5 pl-11 pr-4 text-sm text-on-background outline-none transition duration-200 placeholder:text-charcoal-text/40 ${error
                          ? 'border-accent ring-2 ring-accent/10 focus:border-accent'
                          : 'border-outline-strong focus:border-secondary focus:ring-4 focus:ring-secondary/10'
                        }`}
                    />
                  </div>
                  {error && (
                    <p className="mt-1.5 text-xs text-accent font-medium">{error}</p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3.5 px-6 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-secondary/95 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Sending link...</span>
                    </div>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Back to sign in link */}
            <div className="mt-8 text-center text-sm">
              <Link
                to="/login"
                className="font-bold text-secondary hover:text-secondary/85 hover:underline"
              >
                Return to Login
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
