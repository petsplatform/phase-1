import { Link } from "react-router-dom";
import { BookOpen, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { ChevronDownIcon } from "../components/common/HeaderIcons";
import { featureFlags } from "../config/siteNavigation";

const posts = [
  {
    title: "Choosing Everyday Pet Essentials",
    category: "Care Guide",
    summary:
      "A simple checklist for food, grooming, dental care, and wellness basics before you place an order.",
    icon: ShieldCheck,
  },
  {
    title: "When Prescription Products Need Extra Care",
    category: "Medicine",
    summary:
      "How prescription-required items, vet verification, and document uploads help keep pet medicine orders responsible.",
    icon: HeartPulse,
  },
  featureFlags.autoOrder && {
    title: "Repeat Delivery For Regular Supplies",
    category: "Auto-Order",
    summary:
      "Use repeat delivery for pet food, supplements, and routine essentials so important items arrive on schedule.",
    icon: Sparkles,
  },
].filter(Boolean);

const Blog = () => (
  <>
    <SEO
      title="Blog | Best Vet Care"
      description="Pet care tips, medicine ordering guidance, and shopping updates from Best Vet Care."
    />
    <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
      <Header />
      <main className="px-4 pb-8 pt-6 sm:px-5 lg:px-[22px]">
        <div className="mx-auto max-w-[1120px]">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
            <Link to="/" className="transition-colors hover:text-[#d9aa3d]">Home</Link>
            <ChevronDownIcon className="h-3 w-3 -rotate-90" />
            <span className="font-extrabold text-[#122a50]">Blog</span>
          </nav>

          <section className="mt-5 rounded-2xl border border-[#17345f1a] bg-[#f8f1df] px-5 py-8 shadow-[0_12px_36px_rgba(18,42,80,0.08)] sm:px-8">
            <div className="flex max-w-3xl items-center gap-4">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#d9aa3d] shadow-sm">
                <BookOpen className="h-7 w-7" />
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-normal text-[#122a50] sm:text-4xl">
                  Blog
                </h1>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">
                  Helpful pet-care reads, product guidance, and store updates for pet parents.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            {posts.map((post) => {
              const Icon = post.icon;
              return (
                <article key={post.title} className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8f1df] text-[#d9aa3d]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-xs font-extrabold uppercase text-[#d9aa3d]">{post.category}</p>
                  <h2 className="mt-2 text-lg font-extrabold text-[#122a50]">{post.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">{post.summary}</p>
                </article>
              );
            })}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  </>
);

export default Blog;
