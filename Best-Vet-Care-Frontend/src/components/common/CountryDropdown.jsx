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
    <div className="relative w-full text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={
          className ||
          "flex h-10 w-full items-center justify-between rounded-lg border border-[#17345f1a] bg-white px-3 text-sm font-semibold text-[#122a50] outline-none transition-all focus:border-[#17345f] cursor-pointer"
        }
      >
        <span className="truncate">{selectedCountry}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#122a50]/50 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 rounded-xl border border-[#17345f1a] bg-white p-2 shadow-lg transition-all ${
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#122a50]/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search country..."
              className="w-full rounded-lg border border-[#17345f1a] bg-[#fffdf7] py-1.5 pl-8 pr-3 text-xs font-semibold text-[#122a50] outline-none focus:border-[#17345f]"
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
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs font-semibold transition-colors ${
                    selectedCountry === country
                      ? "bg-[#17345f] text-white font-bold"
                      : "text-[#122a50] hover:bg-[#f8f1df]"
                  }`}
                >
                  <span>{country}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-center text-xs font-medium text-[#122a50]/50">
                No country found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
