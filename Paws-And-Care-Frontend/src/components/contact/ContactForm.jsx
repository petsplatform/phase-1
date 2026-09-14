import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { helpCategories } from '../../data/contactData';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    orderNumber: '',
    message: '',
    consent: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const fileInputRef = useRef(null);

  const maxCharLimit = 500;

  // Validation helper
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'firstName':
        if (!value.trim()) error = 'First name is required.';
        break;
      case 'lastName':
        if (!value.trim()) error = 'Last name is required.';
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email address is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address.';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          error = 'Phone number is required.';
        } else if (!/^\+?[\d\s\-()]{7,15}$/.test(value)) {
          error = 'Please enter a valid phone number.';
        }
        break;
      case 'subject':
        if (!value.trim()) error = 'Subject is required.';
        break;
      case 'category':
        if (!value) error = 'Please select a help category.';
        break;
      case 'message':
        if (!value.trim()) {
          error = 'Message is required.';
        } else if (value.trim().length < 10) {
          error = 'Message must be at least 10 characters.';
        } else if (value.length > maxCharLimit) {
          error = `Message cannot exceed ${maxCharLimit} characters.`;
        }
        break;
      case 'consent':
        if (!value) error = 'You must consent to our privacy policy.';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    if (touched[name]) {
      const error = validateField(name, fieldValue);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, fieldValue);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        attachment: 'File size must be under 5MB.',
      }));
      return;
    }

    setAttachment(file);
    setErrors((prev) => ({
      ...prev,
      attachment: '',
    }));
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Trigger validation for all fields
    const newErrors = {};
    const newTouched = {};
    Object.keys(formData).forEach((key) => {
      newTouched[key] = true;
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setTouched(newTouched);
    setErrors(newErrors);

    // If there are errors, scroll to the first one or abort
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Process Form (simulated network call)
    setIsSubmitting(true);
    setSubmitStatus(null);

    setTimeout(() => {
      // Simulation success
      setIsSubmitting(false);
      setSubmitStatus('success');
      // Reset form fields
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
        orderNumber: '',
        message: '',
        consent: false,
      });
      setAttachment(null);
      setTouched({});
      setErrors({});
    }, 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-brand-border/60 p-6 sm:p-10 shadow-xl shadow-brand-peach/5 transition-all duration-300">
      {submitStatus === 'success' ? (
        <div className="flex flex-col items-center text-center py-10 md:py-16 space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center animate-bounce">
            <CheckCircle size={44} className="stroke-[1.8]" />
          </div>
          <div className="space-y-3">
            <h3 className="font-heading font-black text-2xl sm:text-3xl text-brand-text">
              Message Sent!
            </h3>
            <p className="font-sans text-sm sm:text-base text-brand-muted max-w-md leading-relaxed">
              Thanks for contacting PawsAndCare. Our support team will get back to you shortly.
            </p>
          </div>
          <button
            onClick={() => setSubmitStatus(null)}
            className="px-6 py-2.5 rounded-xl border border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white font-sans font-bold text-xs sm:text-sm transition-all duration-300 transform active:scale-95 cursor-pointer"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left border-b border-brand-border/40 pb-5">
            <h3 className="font-heading font-black text-xl sm:text-2xl text-brand-text mb-1">
              Send Us a Message
            </h3>
            <p className="font-sans text-xs sm:text-sm text-brand-muted">
              Have specific details or query? Fill out the form below and we will route it to the right support queue.
            </p>
          </div>

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="firstName" className="font-sans font-bold text-xs text-brand-text/90">
                First Name <span className="text-brand-coral">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="Buddy"
                className={`w-full py-2.5 px-4 rounded-xl border font-sans text-sm transition-all duration-200 outline-none ${
                  errors.firstName && touched.firstName
                    ? 'border-brand-coral focus:border-brand-coral bg-brand-coral/5'
                    : 'border-brand-border/80 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal bg-brand-bg/10'
                }`}
              />
              {errors.firstName && touched.firstName && (
                <p className="text-[10px] text-brand-coral font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                  <AlertCircle size={10} /> {errors.firstName}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="lastName" className="font-sans font-bold text-xs text-brand-text/90">
                Last Name <span className="text-brand-coral">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="McPaw"
                className={`w-full py-2.5 px-4 rounded-xl border font-sans text-sm transition-all duration-200 outline-none ${
                  errors.lastName && touched.lastName
                    ? 'border-brand-coral focus:border-brand-coral bg-brand-coral/5'
                    : 'border-brand-border/80 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal bg-brand-bg/10'
                }`}
              />
              {errors.lastName && touched.lastName && (
                <p className="text-[10px] text-brand-coral font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                  <AlertCircle size={10} /> {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="email" className="font-sans font-bold text-xs text-brand-text/90">
                Email Address <span className="text-brand-coral">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="buddy@example.com"
                className={`w-full py-2.5 px-4 rounded-xl border font-sans text-sm transition-all duration-200 outline-none ${
                  errors.email && touched.email
                    ? 'border-brand-coral focus:border-brand-coral bg-brand-coral/5'
                    : 'border-brand-border/80 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal bg-brand-bg/10'
                }`}
              />
              {errors.email && touched.email && (
                <p className="text-[10px] text-brand-coral font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                  <AlertCircle size={10} /> {errors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="phone" className="font-sans font-bold text-xs text-brand-text/90">
                Phone Number <span className="text-brand-coral">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="+1 (800) 123-4567"
                className={`w-full py-2.5 px-4 rounded-xl border font-sans text-sm transition-all duration-200 outline-none ${
                  errors.phone && touched.phone
                    ? 'border-brand-coral focus:border-brand-coral bg-brand-coral/5'
                    : 'border-brand-border/80 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal bg-brand-bg/10'
                }`}
              />
              {errors.phone && touched.phone && (
                <p className="text-[10px] text-brand-coral font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                  <AlertCircle size={10} /> {errors.phone}
                </p>
              )}
            </div>
          </div>

          {/* Subject & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="subject" className="font-sans font-bold text-xs text-brand-text/90">
                Subject <span className="text-brand-coral">*</span>
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={formData.subject}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="What is your question about?"
                className={`w-full py-2.5 px-4 rounded-xl border font-sans text-sm transition-all duration-200 outline-none ${
                  errors.subject && touched.subject
                    ? 'border-brand-coral focus:border-brand-coral bg-brand-coral/5'
                    : 'border-brand-border/80 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal bg-brand-bg/10'
                }`}
              />
              {errors.subject && touched.subject && (
                <p className="text-[10px] text-brand-coral font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                  <AlertCircle size={10} /> {errors.subject}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="category" className="font-sans font-bold text-xs text-brand-text/90">
                Help Category <span className="text-brand-coral">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`w-full py-2.5 px-4 rounded-xl border font-sans text-sm transition-all duration-200 outline-none appearance-none ${
                  errors.category && touched.category
                    ? 'border-brand-coral focus:border-brand-coral bg-brand-coral/5'
                    : 'border-brand-border/80 focus:border-brand-teal bg-brand-bg/10'
                }`}
              >
                <option value="">Select a Category</option>
                {helpCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.category && touched.category && (
                <p className="text-[10px] text-brand-coral font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                  <AlertCircle size={10} /> {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Order Number (Optional) */}
          <div className="flex flex-col gap-1 text-left">
            <label htmlFor="orderNumber" className="font-sans font-bold text-xs text-brand-text/90">
              Order Number <span className="text-brand-muted/60 font-normal">(Optional)</span>
            </label>
            <input
              id="orderNumber"
              name="orderNumber"
              type="text"
              value={formData.orderNumber}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. #ORD-827162"
              className="w-full py-2.5 px-4 rounded-xl border border-brand-border/80 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal font-sans text-sm bg-brand-bg/10 outline-none transition-all duration-200"
            />
          </div>

          {/* Message Area */}
          <div className="flex flex-col gap-1 text-left">
            <div className="flex justify-between items-baseline">
              <label htmlFor="message" className="font-sans font-bold text-xs text-brand-text/90">
                Message <span className="text-brand-coral">*</span>
              </label>
              <span className={`text-[10px] font-mono ${
                formData.message.length > maxCharLimit ? 'text-brand-coral font-bold' : 'text-brand-muted/70'
              }`}>
                {formData.message.length} / {maxCharLimit}
              </span>
            </div>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              placeholder="Type your message here..."
              className={`w-full py-2.5 px-4 rounded-xl border font-sans text-sm transition-all duration-200 outline-none resize-none ${
                errors.message && touched.message
                  ? 'border-brand-coral focus:border-brand-coral bg-brand-coral/5'
                  : 'border-brand-border/80 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal bg-brand-bg/10'
              }`}
            />
            {errors.message && touched.message ? (
              <p className="text-[10px] text-brand-coral font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                <AlertCircle size={10} /> {errors.message}
              </p>
            ) : (
              <p className="text-[10px] text-brand-muted/60 pl-1 mt-0.5">
                Must be at least 10 characters.
              </p>
            )}
          </div>

          {/* Attachment Upload (Optional) */}
          <div className="flex flex-col gap-1 text-left">
            <span className="font-sans font-bold text-xs text-brand-text/90 mb-1">
              Attachment <span className="text-brand-muted/60 font-normal">(Optional, max 5MB)</span>
            </span>

            {attachment ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-brand-teal/20 bg-brand-teal/5">
                {attachment.type.startsWith('image/') ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-brand-teal/10 shrink-0">
                    <img
                      src={URL.createObjectURL(attachment)}
                      alt="Attachment Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-brand-teal/15 flex items-center justify-center text-brand-teal shrink-0">
                    <Upload size={18} />
                  </div>
                )}
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-sans font-bold text-brand-text truncate">
                    {attachment.name}
                  </p>
                  <p className="text-[10px] font-sans text-brand-muted/80">
                    {(attachment.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="w-7 h-7 rounded-full bg-white shadow flex items-center justify-center text-brand-muted hover:text-brand-coral transition-colors"
                  aria-label="Remove attachment"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-brand-border/80 hover:border-brand-teal hover:bg-brand-teal/5 transition-all duration-300 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload size={20} className="text-brand-muted hover:text-brand-teal transition-colors" />
                <span className="text-xs font-sans text-brand-muted font-bold">
                  Click to select file
                </span>
                <span className="text-[10px] font-sans text-brand-muted/50">
                  PNG, JPG, PDF (Up to 5MB)
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                />
              </div>
            )}
            {errors.attachment && (
              <p className="text-[10px] text-brand-coral font-bold flex items-center gap-1 mt-0.5">
                <AlertCircle size={10} /> {errors.attachment}
              </p>
            )}
          </div>

          {/* Privacy Consent Checkbox */}
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-start gap-2.5">
              <input
                id="consent"
                name="consent"
                type="checkbox"
                checked={formData.consent}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className="mt-1 w-4 h-4 rounded border-brand-border focus:ring-brand-teal text-brand-teal focus:border-brand-teal accent-brand-teal transition-all duration-200 cursor-pointer"
              />
              <label htmlFor="consent" className="font-sans text-xs text-brand-muted leading-tight cursor-pointer">
                I agree that PawsAndCare can process my contact information to resolve this query in accordance with the Privacy Policy. <span className="text-brand-coral font-bold">*</span>
              </label>
            </div>
            {errors.consent && touched.consent && (
              <p className="text-[10px] text-brand-coral font-bold flex items-center gap-1 mt-1 animate-pulse">
                <AlertCircle size={10} /> {errors.consent}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-sans font-bold text-sm tracking-wide transition-all duration-300 transform active:scale-98 cursor-pointer ${
              isSubmitting
                ? 'bg-brand-teal/40 text-brand-teal/80 cursor-not-allowed'
                : 'bg-brand-coral text-white hover:bg-brand-coral-dark hover:shadow-lg hover:shadow-brand-coral/10'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending Message...
              </>
            ) : (
              'Send Message'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
