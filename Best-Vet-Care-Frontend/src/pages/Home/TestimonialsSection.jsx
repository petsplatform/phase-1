import { useRef } from 'react';
import RatingBar from '../../components/ui/RatingBar';

const TestimonialsSection = () => {
  const scrollContainerRef = useRef(null);

  const testimonials = [
    {
      id: 1,
      rating: 5,
      text: 'The calming bed is soft, supportive, and my dog settled into it immediately. Delivery was quick, the package arrived safely, and the quality feels worth it.',
      author: 'Clasissa Agatha',
      time: '2 Days Ago',
      avatar: '/images/img_ellipse_1.png'
    },
    {
      id: 2,
      rating: 5,
      text: 'The support team helped me choose the right carrier size for my cat. Ordering was simple, delivery was on time, and the fit is perfect.',
      author: 'Chrisnanda Ega',
      time: '2 Days Ago',
      avatar: '/images/img_ellipse_1_60x60.png'
    },
    {
      id: 3,
      rating: 5,
      text: 'The feeding set looks clean and modern, and it is easy to wash after every meal. The color matches the photos and feels sturdy.',
      author: 'Chris Jhon',
      time: '2 Days Ago',
      avatar: '/images/img_ellipse_1_1.png'
    },
    {
      id: 4,
      rating: 5,
      text: 'The grooming kit arrived exactly as shown. Packaging was secure, the brush is gentle, and my pet stays calm during grooming now.',
      author: 'Tia Monica',
      time: '2 Days Ago',
      avatar: '/images/img_ellipse_1_2.png'
    },
    {
      id: 5,
      rating: 5,
      text: 'My cats love the new scratcher! It blends perfectly with our living room decor and keeps them entertained for hours. Highly recommended.',
      author: 'Sarah Jenkins',
      time: '3 Days Ago',
      avatar: '/images/img_ellipse_1.png'
    },
    {
      id: 6,
      rating: 5,
      text: 'The adjustable leash is a game changer for our daily walks. It feels incredibly durable and the padded handle is great.',
      author: 'Michael Chen',
      time: '1 Week Ago',
      avatar: '/images/img_ellipse_1_1.png'
    }
  ];

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  return (
    <section className="w-full bg-[#f8f1df] py-12 sm:py-16 md:py-20">
      <div className="mx-4 sm:mx-8 lg:mx-[56px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative">
          {/* Left Column - Header and Controls */}
          <div className="flex flex-col gap-8 sm:gap-12 md:gap-16 w-full lg:w-[26%]">
            <div className="flex flex-col gap-3 sm:gap-4 w-full lg:w-[82%]">
              <h2 
                className="text-[28px] sm:text-[35px] lg:text-[45px] font-semibold leading-tight"
                style={{
                  fontFamily: 'Plus Jakarta Sans',
                  lineHeight: '1.25',
                  color: '#122a50'
                }}
              >
                Our Customers
              </h2>
              
              <p 
                className="text-sm sm:text-base font-normal w-full"
                style={{
                  fontFamily: 'Plus Jakarta Sans',
                  lineHeight: '26px',
                  color: '#122a50b2'
                }}
              >
                Discover what our happy customers are saying about their experience.
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scroll('left')}
                className="p-3 sm:p-[14px] bg-[#122a50] rounded-full hover:bg-opacity-90 transition-all duration-200 transform rotate-180"
                aria-label="Previous testimonials"
              >
                <img 
                  src="/images/img_arrowright_white_a700.svg" 
                  alt="" 
                  className="w-5 h-5 sm:w-[22px] sm:h-[22px]"
                />
              </button>
              
              <button 
                onClick={() => scroll('right')}
                className="p-3 sm:p-[14px] bg-[#122a50] rounded-full hover:bg-opacity-90 transition-all duration-200"
                aria-label="Next testimonials"
              >
                <img 
                  src="/images/img_arrowright_white_a700.svg" 
                  alt="" 
                  className="w-5 h-5 sm:w-[22px] sm:h-[22px]"
                />
              </button>
            </div>
          </div>

          {/* Right Column - Testimonials Grid */}
          <div className="flex-1 relative flex flex-col lg:flex-row min-w-0">
            <div 
              ref={scrollContainerRef}
              className="grid grid-flow-col grid-rows-1 md:grid-rows-2 auto-cols-[100%] md:auto-cols-[calc(50%-8px)] gap-4 w-full overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide pb-2 lg:pb-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.id}
                  className="flex flex-col gap-6 p-6 bg-white rounded-3xl shadow-sm snap-center h-full"
                >
                  {/* Rating */}
                  <RatingBar 
                    rating={testimonial.rating}
                    maxRating={5}
                    size={20}
                    activeColor="#FFA500"
                    readOnly
                    className="flex gap-1"
                  />

                  {/* Testimonial Text */}
                  <p 
                    className="text-base font-normal flex-1"
                    style={{
                      fontFamily: 'Plus Jakarta Sans',
                      lineHeight: '26px',
                      color: '#122a50'
                    }}
                  >
                    {testimonial.text}
                  </p>

                  {/* Author Info */}
                  <div className="flex items-center gap-4 mt-auto pt-2">
                    <img
                      src={testimonial.avatar}
                      alt={`${testimonial.author} avatar`}
                      className="w-12 h-12 rounded-full object-cover border border-gray-100"
                    />
                    
                    <div className="flex flex-col flex-1">
                      <span 
                        className="text-lg font-medium"
                        style={{
                          fontFamily: 'Plus Jakarta Sans',
                          color: '#122a50'
                        }}
                      >
                        {testimonial.author}
                      </span>
                      
                      <span 
                        className="text-sm font-normal italic"
                        style={{
                          fontFamily: 'Plus Jakarta Sans',
                          color: '#122a50b2'
                        }}
                      >
                        {testimonial.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
