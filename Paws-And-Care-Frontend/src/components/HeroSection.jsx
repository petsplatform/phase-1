import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star, ShoppingCart, Sparkles, Heart } from "lucide-react";
import dogHeroImg from "../assets/dog hero.jpg";

const MotionLink = motion.create(Link);

// Reusable Custom SVG Paw icon for decorative elements
const PawIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 14c-1.66 0-3 1.34-3 3 0 1.8 1.5 3 3 3s3-1.2 3-3c0-1.66-1.34-3-3-3z" />
    <circle cx="7.2" cy="10" r="1.8" />
    <circle cx="10.2" cy="7" r="1.8" />
    <circle cx="13.8" cy="7" r="1.8" />
    <circle cx="16.8" cy="10" r="1.8" />
  </svg>
);

export default function HeroSection() {
  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.8, 0.25, 1], // Premium spring-like cubic bezier easeOut
      },
    },
  };

  const trustBadges = [
    "Free Shipping",
    "Secure Checkout",
    "Vet Recommended",
    "Easy Returns",
  ];

  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-brand-bg pt-12 pb-6 sm:pt-16 sm:pb-10 lg:pt-20 lg:pb-12 select-none">
      {/* Background Soft Blurred Blobs */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-brand-teal/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-[450px] h-[450px] bg-brand-coral/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-accent/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Subtle Paw Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] text-brand-text grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-8 p-6 select-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <PawIcon
            key={i}
            className={`w-7 h-7 ${
              i % 3 === 0
                ? "rotate-12 translate-y-3"
                : i % 3 === 1
                  ? "-rotate-12 translate-x-3"
                  : "rotate-45"
            }`}
          />
        ))}
      </div>

      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-10 lg:grid-cols-12 items-center gap-12 lg:gap-16">
          {/* Left Column: Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="md:col-span-6 lg:col-span-7 flex flex-col items-start text-left space-y-6 lg:space-y-8"
          >
            {/* Small Badge */}
            <motion.div
              variants={fadeUpVariants}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-heading font-extrabold uppercase tracking-wider"
            >
              <PawIcon className="w-3.5 h-3.5" />
              <span>Paws & Care • Trusted Pet Store</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUpVariants}
              className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-brand-text leading-[1.1] tracking-tight"
            >
              Everything Your Pet Needs,
              <br />
              <span className="text-brand-coral">Delivered With Love.</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUpVariants}
              className="font-sans text-brand-muted text-base sm:text-lg leading-relaxed max-w-xl"
            >
              Premium food, toys, grooming essentials and healthcare products
              carefully selected for happy, healthy pets.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUpVariants}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
            >
              <MotionLink
                to="/shop"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 bg-brand-coral hover:bg-brand-coral-dark text-white rounded-full px-8 py-4 font-heading font-semibold text-base transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight size={18} />
              </MotionLink>
              <MotionLink
                to="/shop"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white rounded-full px-8 py-4 font-heading font-semibold text-base transition-colors duration-200 cursor-pointer"
              >
                <span>Explore Products</span>
              </MotionLink>
            </motion.div>
          </motion.div>

          {/* Right Column: Hero Image Showcase — hidden on mobile */}
          <div className="hidden md:flex md:col-span-4 lg:col-span-5 relative items-center justify-center">
            {/* Glow effect behind the image */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-brand-accent/20 via-brand-teal/15 to-transparent blur-3xl rounded-full opacity-80 pointer-events-none" />

            {/* Asymmetrical Double Layer Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, -10, 0],
              }}
              transition={{
                scale: { duration: 0.8, ease: "easeOut" },
                opacity: { duration: 0.8, ease: "easeOut" },
                y: {
                  duration: 5,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse",
                },
              }}
              className="relative w-full aspect-[4/5] max-w-[400px] shrink-0"
            >
              {/* Backplate Shadow Offset Card with Brand Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-teal via-brand-golden to-brand-coral rounded-[3.5rem] rounded-tl-[10rem] rounded-br-[10rem] rotate-3 translate-x-2.5 translate-y-2.5 opacity-30 blur-xs" />

              {/* Main Image Container */}
              <motion.div
                whileHover={{ scale: 1.02, rotate: -1 }}
                className="relative w-full h-full overflow-hidden rounded-[3.5rem] rounded-tl-[10rem] rounded-br-[10rem] border-4 border-white shadow-2xl bg-white"
              >
                <img
                  src={dogHeroImg}
                  alt="Golden retriever puppy mascot"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-text/10 via-transparent to-transparent pointer-events-none" />
              </motion.div>
            </motion.div>

            {/* Unified Floating Paw Badge with Orbit Ring — hidden on sm */}
            <div className="absolute -top-12 -right-8 z-20 hidden lg:block">
              {/* Dashed Orbit Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, ease: "linear", repeat: Infinity }}
                className="w-24 h-24 rounded-full border border-dashed border-brand-teal/30 flex items-center justify-center pointer-events-none"
              />
              {/* Floating Pink Paw Badge */}
              <motion.div
                animate={{
                  y: [0, -6, 0],
                  rotate: [12, -12, 12],
                }}
                transition={{
                  duration: 3.5,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2.5 bg-brand-coral text-white rounded-full shadow-lg hover:scale-110 cursor-pointer transition-transform duration-200"
              >
                <PawIcon className="w-5 h-5" />
              </motion.div>
            </div>

            {/* Unified Floating Heart Badge with Orbit Ring — hidden on sm */}
            <div className="absolute bottom-12 -left-12 z-20 hidden lg:block">
              {/* Dashed Orbit Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 28, ease: "linear", repeat: Infinity }}
                className="w-20 h-20 rounded-full border border-dashed border-brand-teal/20 flex items-center justify-center pointer-events-none"
              />
              {/* Floating Teal Heart Badge */}
              <motion.div
                animate={{
                  y: [0, 6, 0],
                  rotate: [-12, 12, -12],
                }}
                transition={{
                  duration: 4.2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2.5 bg-brand-teal text-white rounded-full shadow-lg hover:scale-110 cursor-pointer transition-transform duration-200"
              >
                <Heart size={16} fill="currentColor" />
              </motion.div>
            </div>

            {/* Floating Background Accent Dot */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 4,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="absolute -bottom-8 -left-4 w-12 h-12 rounded-full bg-brand-accent/10 pointer-events-none"
            />

            {/* Sparkles Decoration */}
            <div className="absolute top-1/4 -right-8 text-brand-golden animate-pulse z-10">
              <Sparkles size={20} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
