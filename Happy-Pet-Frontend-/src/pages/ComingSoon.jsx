import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Sparkles, Heart, User, PhoneCall, Mail, Send, Calendar } from "lucide-react";

export default function ComingSoon() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.", {
        icon: "⚠️",
      });
      return;
    }
    toast.success(
      "You've been added to the VIP list! We will notify you the moment we launch.",
      {
        icon: "✨",
      }
    );
    setEmail("");
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between text-brand-purple relative overflow-hidden select-none"
      style={{
        background: "linear-gradient(135deg, #FFF7EF 0%, #F5EEFC 50%, #FFEBE6 100%)",
      }}
    >
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-brand-peach/15 blur-[80px] sm:blur-[120px] pointer-events-none animate-pulse duration-[6000ms]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] rounded-full bg-brand-purple/5 blur-[90px] sm:blur-[140px] pointer-events-none animate-pulse duration-[8000ms]"></div>

      {/* Top logo/branding info */}
      <header className="max-w-[1460px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center gap-2 group text-brand-purple hover:text-brand-purple/80 transition-colors"
        >
          <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight">
            HappyPet<span className="text-brand-peach font-bold font-sans">Rx</span>
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-purple/10 text-xs sm:text-sm font-semibold bg-white/40 hover:bg-white/80 transition-all duration-300 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center px-4 py-8 relative z-10">
        <div className="max-w-2xl w-full text-center bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl p-8 sm:p-12 md:p-16 shadow-xl relative overflow-hidden">
          {/* Paw / Sparkle floating animation */}
          <div className="flex justify-center mb-6 relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-purple text-brand-cream flex items-center justify-center shadow-lg relative animate-bounce duration-[3000ms]">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-brand-peach animate-pulse" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-peach border-2 border-white animate-ping"></div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight leading-tight mb-4 text-brand-purple">
            Fetching Something <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-peach">Amazing</span>
          </h1>

          <p className="text-sm sm:text-base font-medium text-brand-brown/80 max-w-lg mx-auto leading-relaxed mb-8">
            We are polishing up this section to bring you a premium login dashboard, wishlist organization, and direct 24/7 support from licensed veterinarians.
          </p>

          {/* Features in development preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-10 text-left max-w-xl mx-auto">
            <div className="bg-white/60 hover:bg-white/80 border border-brand-purple/5 p-4 rounded-2xl transition-all duration-300 shadow-sm group">
              <div className="w-9 h-9 rounded-xl bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-brand-purple mb-2.5 transition-transform duration-300 group-hover:scale-110">
                <User className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-brand-purple mb-0.5">Secure Dashboard</h3>
              <p className="text-[11px] sm:text-xs text-brand-brown/70 font-medium">Manage prescription orders & vet advice securely.</p>
            </div>
            
            <div className="bg-white/60 hover:bg-white/80 border border-brand-purple/5 p-4 rounded-2xl transition-all duration-300 shadow-sm group">
              <div className="w-9 h-9 rounded-xl bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-brand-purple mb-2.5 transition-transform duration-300 group-hover:scale-110">
                <Heart className="w-4.5 h-4.5 text-brand-peach fill-brand-peach/20" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-brand-purple mb-0.5">Pet Wishlist</h3>
              <p className="text-[11px] sm:text-xs text-brand-brown/70 font-medium">Save favorite food, toys, and custom medications.</p>
            </div>

            <div className="bg-white/60 hover:bg-white/80 border border-[#e2dcf0] p-4 rounded-2xl transition-all duration-300 shadow-sm group">
              <div className="w-9 h-9 rounded-xl bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-brand-purple mb-2.5 transition-transform duration-300 group-hover:scale-110">
                <PhoneCall className="w-4.5 h-4.5 text-brand-peach" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-brand-purple mb-0.5">Vet Support</h3>
              <p className="text-[11px] sm:text-xs text-brand-brown/70 font-medium">Get live advice from our veterinary care experts.</p>
            </div>
          </div>

          {/* Email Form */}
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row w-full max-w-md mx-auto gap-3"
          >
            <div className="relative flex-grow">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to get notified..."
                className="w-full bg-white border border-[#e2dcf0] focus:border-brand-purple focus:outline-none text-brand-purple placeholder:text-brand-brown/40 px-5 py-3.5 pl-11 rounded-2xl text-xs font-semibold shadow-sm transition-all"
                required
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-brand-brown/40" />
              </div>
            </div>
            <button
              type="submit"
              className="bg-brand-purple hover:bg-[#3a0038] text-white hover:scale-[1.02] active:scale-98 font-bold text-xs px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer flex-shrink-0"
            >
              <span>Get Notified</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full px-4 sm:px-6 lg:px-8 py-6 relative z-10 text-center">
        <p className="text-[11px] font-semibold text-brand-brown/50">
          © {new Date().getFullYear()} HappyPet Rx. Launching Fall 2026. All rights reserved. Developed By{" "}
          <a
            href="https://techrabbit.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-brand-purple hover:underline transition-colors"
          >
            Tech Rabbit
          </a>
        </p>
      </footer>
    </div>
  );
}
