import React from 'react';
import { Check } from 'lucide-react';

export default function CheckoutStepper({ currentStep = 1, onStepClick, hasPrescriptionStep = false }) {
  const steps = hasPrescriptionStep
    ? [
        { label: 'Contact Details', number: 1 },
        { label: 'Delivery Address', number: 2 },
        { label: 'Upload Prescription', number: 3 },
        { label: 'Payment', number: 4 }
      ]
    : [
        { label: 'Contact Details', number: 1 },
        { label: 'Delivery Address', number: 2 },
        { label: 'Payment', number: 3 }
      ];

  return (
    <div className="bg-white border border-brand-border/60 p-5 rounded-[2rem] shadow-sm mb-8">
      <div className="max-w-xl mx-auto flex items-center justify-between relative">
        
        {/* Progress Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-brand-border z-0">
          <div 
            className="h-full bg-brand-teal transition-all duration-300 rounded-full"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Stepper items */}
        {steps.map((step, idx) => {
          const stepNum = step.number;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div 
              key={idx} 
              className={`flex flex-col items-center relative z-10 select-none ${isCompleted ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (isCompleted && onStepClick) {
                  onStepClick(stepNum);
                }
              }}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-black text-sm border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-brand-teal border-brand-teal text-white hover:bg-brand-deep-teal hover:border-brand-deep-teal' 
                    : isActive 
                      ? 'bg-white border-brand-teal text-brand-teal shadow-xs' 
                      : 'bg-white border-brand-border text-brand-muted'
                }`}
              >
                {isCompleted ? <Check size={16} /> : stepNum}
              </div>
              <span 
                className={`hidden sm:block text-[10px] uppercase tracking-wider font-heading font-extrabold mt-1.5 transition-colors duration-300 ${
                  isActive ? 'text-brand-teal' : isCompleted ? 'text-brand-text' : 'text-brand-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}

      </div>
    </div>
  );
}
