import { motion } from "framer-motion";
import { ArrowRight, HeartHandshake, PawPrint } from "lucide-react";
import { blogs } from "../../data/blogs";

export default function BlogSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto max-w-[1500px] px-4 pb-8 pt-9 sm:px-6 lg:px-0"
    >
      <h2 className="mb-7 flex items-center justify-center gap-4 text-[23px] font-extrabold leading-none text-textMain">
        <PawPrint
          className="text-secondary"
          size={16}
          fill="currentColor"
          aria-hidden="true"
        />
        Pet Care Tips & Guides
        <PawPrint
          className="text-secondary"
          size={16}
          fill="currentColor"
          aria-hidden="true"
        />
      </h2>
      <div className="grid gap-7 md:grid-cols-[1fr_250px]">
        <div className="grid gap-7 sm:grid-cols-3">
          {blogs.map((blog) => (
            <article
              key={blog.title}
              className="overflow-hidden rounded-[9px] border border-borderSoft bg-white shadow-[0_8px_20px_var(--shadow-card)]"
            >
              <img
                src={blog.image}
                alt={blog.title}
                className="h-[142px] w-full object-cover"
              />
              <div className="px-5 pb-5 pt-4">
                <p className="text-[11px] font-semibold text-muted">
                  {blog.date}
                </p>
                <h3 className="mt-3 min-h-[50px] text-[14px] font-extrabold leading-tight text-textMain">
                  {blog.title}
                </h3>
                <a
                  href="#"
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-extrabold text-secondaryDark"
                >
                  Read More
                  <ArrowRight size={13} />
                </a>
              </div>
            </article>
          ))}
        </div>
        <aside className="grid min-h-[305px] place-items-center rounded-[14px] bg-card px-8 py-7 text-center shadow-card">
          <div>
            <HeartHandshake className="mx-auto text-secondaryDark" size={58} />
            <h3 className="mt-5 text-[31px] font-extrabold leading-[1.08] text-secondaryDark">
              We care for them like you do.
            </h3>
            <button
              type="button"
              className="mt-7 inline-flex h-[42px] items-center justify-center gap-2 rounded-[8px] bg-secondaryDark px-7 text-[14px] font-extrabold text-white shadow-card transition-transform hover:scale-105"
              aria-label="Learn More"
            >
              Learn More
              <PawPrint size={15} fill="currentColor" aria-hidden="true" />
            </button>
          </div>
        </aside>
      </div>
    </motion.section>
  );
}
