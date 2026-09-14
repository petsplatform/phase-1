import category1 from "../../assets/Home/Categories/category1.png";
import category2 from "../../assets/Home/Categories/category2.png";
import category3 from "../../assets/Home/Categories/category3.png";
import category4 from "../../assets/Home/Categories/category4.png";
import category5 from "../../assets/Home/Categories/category5.png";
import category6 from "../../assets/Home/Categories/category6.png";

const categories = [
  {
    id: "Flea & Tick Prevention",
    label: "Flea & Tick Prevention",
    image: category1,
  },
  {
    id: "Prescription Refills",
    label: "Prescription Refills",
    image: category2,
  },
  {
    id: "Hip & Joint Mobility",
    label: "Hip & Joint Mobility",
    image: category3,
  },
  {
    id: "Skin & Allergy Relief",
    label: "Skin & Allergy Relief",
    image: category4,
  },
  {
    id: "Anxiety & Calming",
    label: "Anxiety & Calming",
    image: category5,
  },
  {
    id: "Ear & Eye Care",
    label: "Ear & Eye Care",
    image: category6,
  },
];

export default function CategoryFilterGrid({ selectedCategory, setSelectedCategory }) {
  const handleCategoryClick = (categoryId) => {
    if (selectedCategory === categoryId) {
      // Clear selection if already selected
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  return (
    <section className="relative py-10 bg-white border-b border-slate-100">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-green/20 bg-emerald-50/80 px-3.5 py-1.5 shadow-xs">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-dark-green">
              Health Catalog
            </span>
          </div>
          <h2 className="font-display text-[1.8rem] font-extrabold leading-[1.1] tracking-tight text-deep-navy sm:text-[2.2rem]">
            Filter by Pet Health Category
          </h2>
        </div>

        {/* Categories Layout */}
        <div className="flex flex-wrap justify-center gap-5 sm:gap-6 lg:gap-8">
          {categories.map(({ id, label, image }) => {
            const isSelected = selectedCategory === id;
            return (
              <button
                key={id}
                onClick={() => handleCategoryClick(id)}
                className="group flex flex-col items-center cursor-pointer w-24 sm:w-28 shrink-0 text-left"
              >
                {/* Squircle Image Card */}
                <div
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] border transition-all duration-500 overflow-hidden relative shadow-soft ${
                    isSelected
                      ? "border-primary-green ring-2 ring-primary-green/30 shadow-[0_16px_32px_rgba(88,185,71,0.18)]"
                      : "border-deep-navy/8 bg-white group-hover:border-primary-green group-hover:shadow-[0_16px_32px_rgba(15,45,82,0.12)] group-hover:-translate-y-1"
                  }`}
                >
                  <img
                    src={image}
                    alt={label}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary-green/10 flex items-center justify-center">
                      <div className="bg-primary-green text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                        Selected
                      </div>
                    </div>
                  )}
                </div>

                {/* Centered Name Label */}
                <span
                  className={`mt-3 text-center font-extrabold transition-colors duration-300 text-xs sm:text-sm tracking-tight leading-tight ${
                    isSelected
                      ? "text-primary-green"
                      : "text-deep-navy group-hover:text-primary-green"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
