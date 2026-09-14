import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export const ALL_COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "India",
  "Germany",
  "France",
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Argentina",
  "Armenia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "Gabon",
  "Gambia",
  "Georgia",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Somalia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "Uruguay",
  "Uzbekistan",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

export default function CountryDropdown({ value, onChange, className, dropUp = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  const selectedCountry = value || "United States";

  const filteredCountries = ALL_COUNTRIES.filter((c) =>
    c.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setSearchTerm("");
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTop = 0;
        }
      }, 10);
    }
  };

  const handleSelect = (country) => {
    if (onChange) {
      onChange(country);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={
          className ||
          "w-full px-3.5 py-2.5 bg-[#FCF9F6] border border-brand-purple/10 focus:border-brand-purple/45 rounded-xl text-brand-purple text-xs font-semibold flex items-center justify-between outline-none transition-all cursor-pointer select-none"
        }
      >
        <span>{selectedCountry}</span>
        <ChevronDown
          className={`w-4 h-4 text-brand-purple/60 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 left-0 right-0 bg-white border border-brand-purple/15 rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-150 p-1.5 ${
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <div className="relative mb-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-purple/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search country..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#faf8ff] border border-brand-purple/10 rounded-lg text-xs text-brand-purple outline-none focus:border-brand-purple/35"
              autoFocus
            />
          </div>

          <div ref={listRef} className="max-h-[200px] overflow-y-auto space-y-0.5">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                    selectedCountry === country
                      ? "bg-brand-purple text-white font-bold"
                      : "text-brand-purple hover:bg-brand-purple/5"
                  }`}
                >
                  <span>{country}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-brand-brown/50 text-center font-medium">
                No country found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
