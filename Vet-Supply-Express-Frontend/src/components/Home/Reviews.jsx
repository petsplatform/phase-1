import React from "react";
import { Star, ShieldCheck, Quote } from "lucide-react";
import avatarImage from "../../assets/Logo/logo.png";

const Reviews = () => {
  const reviewsList = [
    {
      name: "Verified Customer",
      role: "Veterinary Clinic",
      comment: "Excellent service and fast delivery. The products are exactly as described and the quality is outstanding. Highly recommend for any veterinary practice.",
      rating: 5,
      avatar: avatarImage
    },
    {
      name: "Verified Customer",
      role: "Pet Owner",
      comment: "Great selection of veterinary supplies. The ordering process was smooth and delivery was prompt. Will definitely order again.",
      rating: 5,
      avatar: avatarImage
    },
    {
      name: "Verified Customer",
      role: "Pet Parent",
      comment: "Very happy with my purchase. Products arrived well-packaged and in perfect condition. The customer support team was also very helpful.",
      rating: 5,
      avatar: avatarImage
    }
  ];

  return (
    <section className="py-16 bg-white border-b border-[#D9E8F2] select-none">
      <div className="container-custom">
        
        {/* Header Section */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0874C9]">
            Client Endorsements
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-[#102A43] mt-2">
            Trusted by the Vet Community
          </h2>
          <p className="text-sm text-[#627D98] mt-2">
            Hear from veterinary practitioners and pet parents about their experience with us.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviewsList.map((rev, idx) => (
            <div
              key={idx}
              className="bg-[#F7FAFC] border border-[#D9E8F2] hover:border-[#0874C9]/20 p-6 rounded-2xl shadow-sm transition-all duration-300 relative flex flex-col justify-between"
            >
              {/* Quote Decorative Icon */}
              <div className="absolute top-6 right-6 text-[#EAF5FC] select-none pointer-events-none">
                <Quote className="w-12 h-12 rotate-180" />
              </div>

              {/* Review Stars */}
              <div className="flex items-center text-[#F28C18] gap-1 mb-4">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F28C18] text-[#F28C18]" />
                ))}
              </div>

              {/* Review Comment */}
              <p className="text-sm text-[#102A43] leading-relaxed italic mb-8 relative z-10 text-left">
                "{rev.comment}"
              </p>

              {/* Reviewer Bio */}
              <div className="flex items-center gap-3 border-t border-[#D9E8F2] pt-4 text-left">
                <img
                  src={rev.avatar}
                  alt={rev.name}
                  className="w-11 h-11 object-cover rounded-full border border-[#D9E8F2]"
                />
                <div className="min-w-0">
                  <h4 className="font-heading font-bold text-sm text-[#102A43] truncate">
                    {rev.name}
                  </h4>
                  <p className="text-[11px] text-[#627D98] truncate">{rev.role}</p>
                </div>
                <div className="ml-auto bg-[#EAF5FC] text-[#0874C9] p-1 rounded-full shrink-0" title="Verified Purchaser">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Reviews;
