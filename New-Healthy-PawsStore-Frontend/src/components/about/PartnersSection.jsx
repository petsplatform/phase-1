const partners = ["ROYAL CANIN", "Pedigree", "drools", "Himalaya", "PUREPET", "whiskas"];

export default function PartnersSection() {
  const marqueePartners = [...partners, ...partners];

  return (
    <section className="border-t border-borderSoft bg-white px-4 py-8 sm:px-6 lg:px-[76px]">
      <div className="mx-auto max-w-[1320px]">
        <h2 className="mb-7 text-center text-[20px] font-extrabold text-textMain">Our Trusted Partners</h2>
        <div className="-mx-4 overflow-hidden sm:hidden">
          <div className="flex w-max animate-partner-marquee gap-4 px-4">
            {marqueePartners.map((partner, index) => (
              <PartnerCard key={`${partner}-${index}`} partner={partner} index={index} mobile />
            ))}
          </div>
        </div>
        <div className="hidden gap-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {partners.map((partner, index) => (
            <PartnerCard key={partner} partner={partner} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnerCard({ partner, index, mobile = false }) {
  return (
    <article className={`grid place-items-center rounded-[12px] border border-borderSoft bg-white shadow-card ${mobile ? "h-[78px] w-[230px] shrink-0" : "h-[86px]"}`}>
      <span className={`font-display text-[21px] font-extrabold sm:text-[22px] ${index % 3 === 0 ? "text-brandRed" : index % 3 === 1 ? "text-brandBlue" : "text-brandPurple"}`}>
        {partner}
      </span>
    </article>
  );
}
