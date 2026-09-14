import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import logo from '../../assets/Logo/footer-logo.png'
import petLoginImg from '../../assets/Authentication/loginbg.png'
import { authApi } from '../../api/authApi'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  // Validation and processing states
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const validateForm = () => {
    const newErrors = {}

    const nameVal = name.trim()
    if (!nameVal) {
      newErrors.name = 'Full name is required'
    } else if (nameVal.length < 2) {
      newErrors.name = 'Full name must be at least 2 characters'
    } else if (nameVal.length > 50) {
      newErrors.name = 'Full name must not exceed 50 characters'
    }

    const emailVal = email.trim()
    if (!emailVal) {
      newErrors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      newErrors.email = 'Please enter a valid email address'
    } else if (emailVal.length > 100) {
      newErrors.email = 'Email address must not exceed 100 characters'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
    } else if (password.length > 50) {
      newErrors.password = 'Password must not exceed 50 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms & conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      await authApi.register({ name, email, password })
      setIsSubmitting(false)
      setSubmitSuccess(true)

      setTimeout(() => {
        navigate('/')
      }, 1200)
    } catch (error) {
      setIsSubmitting(false)
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';
      setErrors((prev) => ({
        ...prev,
        submit: msg,
      }))
    }
  }

  return (
    <div className="flex min-h-screen bg-background font-sans lg:h-screen lg:overflow-hidden">
      {/* Back button (Top Left) */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-10 flex items-center gap-2 rounded-full border border-outline bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-charcoal-text backdrop-blur-md transition hover:border-secondary hover:text-secondary hover:shadow-sm"
      >
        <ArrowLeft size={14} />
        <span>Back to Store</span>
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
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Join the Family</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white font-display">
              Unconditional Love, <br />Budget-Friendly Care
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              Create an account today to get a 10% discount on your first order, track all shipments, and receive personalized health and nutrition guides for your pets.
            </p>
          </div>
        </div>

        {/* Right Side: Sign Up Form Pane */}
        <div className="flex w-full items-center justify-center p-8 sm:p-12 lg:w-1/2 lg:h-full lg:overflow-y-auto">
          <div className="w-full max-w-md text-left">

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <Link to="/">
                <img
                  src={logo}
                  alt="Budget PetShop Logo"
                  className="h-24 w-auto object-contain mb-3 transition transform hover:scale-105"
                />
              </Link>
              <h1 className="text-2xl font-bold text-on-background font-display tracking-tight">
                Create an Account
              </h1>
              <p className="text-sm text-charcoal-text mt-1.5">
                Join thousands of pet lovers and enjoy exclusive savings
              </p>
            </div>

            {/* Success Message */}
            {submitSuccess ? (
              <div className="rounded-2xl bg-surface-tint border border-secondary/20 p-6 text-center animate-fade-in-up">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary mb-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-md font-bold text-secondary">Registration Successful!</h3>
                <p className="text-xs text-charcoal-text mt-1">Taking you to the login screen...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {errors.submit && (
                  <p className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-xs font-semibold text-accent">
                    {errors.submit}
                  </p>
                )}

                {/* Full Name */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text">
                      Full Name *
                    </label>
                    <span className="text-[10px] font-semibold text-gray-500">Min 2, Max 50 chars</span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-charcoal-text/60">
                      <User size={18} />
                    </span>
                    <input
                      type="text"
                      maxLength={50}
                      placeholder="e.g., Alex Johnson"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
                      }}
                      className={`w-full rounded-2xl border bg-white py-3 pl-11 pr-4 text-sm text-on-background outline-none transition duration-200 placeholder:text-charcoal-text/40 ${errors.name
                          ? 'border-accent ring-2 ring-accent/10 focus:border-accent'
                          : 'border-outline-strong focus:border-secondary focus:ring-4 focus:ring-secondary/10'
                        }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-xs text-accent font-medium">{errors.name}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text">
                      Email Address *
                    </label>
                    <span className="text-[10px] font-semibold text-gray-500">Valid email</span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-charcoal-text/60">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      maxLength={100}
                      placeholder="e.g., alex@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                      }}
                      className={`w-full rounded-2xl border bg-white py-3 pl-11 pr-4 text-sm text-on-background outline-none transition duration-200 placeholder:text-charcoal-text/40 ${errors.email
                          ? 'border-accent ring-2 ring-accent/10 focus:border-accent'
                          : 'border-outline-strong focus:border-secondary focus:ring-4 focus:ring-secondary/10'
                        }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-accent font-medium">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text">
                      Password *
                    </label>
                    <span className="text-[10px] font-semibold text-gray-500">Min 6 chars</span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-charcoal-text/60">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      maxLength={50}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                      }}
                      className={`w-full rounded-2xl border bg-white py-3 pl-11 pr-12 text-sm text-on-background outline-none transition duration-200 placeholder:text-charcoal-text/40 ${errors.password
                          ? 'border-accent ring-2 ring-accent/10 focus:border-accent'
                          : 'border-outline-strong focus:border-secondary focus:ring-4 focus:ring-secondary/10'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-charcoal-text/60 hover:text-on-background cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-accent font-medium">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text">
                      Confirm Password *
                    </label>
                    <span className="text-[10px] font-semibold text-gray-500">Must match</span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-charcoal-text/60">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      maxLength={50}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }))
                      }}
                      className={`w-full rounded-2xl border bg-white py-3 pl-11 pr-12 text-sm text-on-background outline-none transition duration-200 placeholder:text-charcoal-text/40 ${errors.confirmPassword
                          ? 'border-accent ring-2 ring-accent/10 focus:border-accent'
                          : 'border-outline-strong focus:border-secondary focus:ring-4 focus:ring-secondary/10'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-charcoal-text/60 hover:text-on-background cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-accent font-medium">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div>
                  <div className="flex items-start">
                    <label className="relative flex cursor-pointer items-center rounded-full mt-0.5">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => {
                          setAcceptTerms(e.target.checked)
                          if (errors.acceptTerms) setErrors(prev => ({ ...prev, acceptTerms: '' }))
                        }}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-outline-strong bg-white checked:border-secondary checked:bg-secondary transition-all"
                      />
                      <span className="absolute text-white opacity-0 pointer-events-none peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    </label>
                    <span className="ml-3 text-xs text-charcoal-text leading-relaxed select-none">
                      I agree to the{' '}
                      <a href="#terms" className="font-semibold text-secondary hover:underline">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#privacy" className="font-semibold text-secondary hover:underline">Privacy Policy</a>.
                    </span>
                  </div>
                  {errors.acceptTerms && (
                    <p className="mt-1.5 text-xs text-accent font-medium">{errors.acceptTerms}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3 px-6 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-secondary/95 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign Up</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Login Link */}
            <div className="mt-6 text-center text-sm">
              <span className="text-charcoal-text">Already have an account? </span>
              <Link
                to="/login"
                className="font-bold text-secondary hover:text-secondary/85 hover:underline"
              >
                Sign in
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
