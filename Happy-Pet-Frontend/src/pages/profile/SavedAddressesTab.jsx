import { MapPin } from "lucide-react";
import { accountApi } from "../../api/accountApi";
import CountryDropdown from "../../components/common/CountryDropdown";

const COUNTRIES = [
  "United States",
  "India",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
];

const withAddressIds = (addresses = []) =>
  addresses.map((address, index) => ({
    id: address.id || `addr_${index}`,
    country: "United States",
    isDefault: index === 0,
    ...address,
  }));

const isValidPhone = (phone) => {
  const value = String(phone || "").trim();
  if (!value) return false;
  if (!/^\+?[0-9\s\-()]+$/.test(value)) return false;
  const digitCount = value.replace(/\D/g, "").length;
  return digitCount === 10;
};

export default function SavedAddressesTab({
  currentUser,
  addresses,
  setAddresses,
  isAddingAddress,
  setIsAddingAddress,
  editingAddressId,
  setEditingAddressId,
  addressForm,
  setAddressForm,
  toast,
}) {
  const resetForm = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      const addressIndex = addresses.findIndex((addr) => addr.id === id);
      if (addressIndex >= 0) {
        const updated = await accountApi.removeAddress(addressIndex);
        setAddresses(withAddressIds(updated));
        toast.success("Address deleted successfully!");
      }
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast.error(error.response?.data?.message || "Failed to delete address.");
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const name = String(addressForm.name || "").trim();
    const phoneDigits = String(addressForm.phone || "").replace(/\D/g, "");
    const addr = String(addressForm.address || "").trim();
    const city = String(addressForm.city || "").trim();
    const state = String(addressForm.state || "").trim();
    const zip = String(addressForm.zip || "").trim();

    if (name.length < 2 || name.length > 50) {
      toast.error("Please enter a valid full name (2 to 50 characters).");
      return;
    }
    if (!addressForm.phone || phoneDigits.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    if (addr.length < 5 || addr.length > 100) {
      toast.error("Please enter a valid address (5 to 100 characters).");
      return;
    }
    if (city.length < 2 || city.length > 50) {
      toast.error("Please enter a valid city name (2 to 50 characters).");
      return;
    }
    if (state.length < 2 || state.length > 50) {
      toast.error("Please enter a valid state/province (2 to 50 characters).");
      return;
    }
    if (zip.length < 3 || zip.length > 10) {
      toast.error("Please enter a valid ZIP/Postal code (3 to 10 characters).");
      return;
    }

    try {
      let updatedAddresses;

      if (editingAddressId) {
        const addressIndex = addresses.findIndex((addr) => addr.id === editingAddressId);
        const existingAddress = addresses[addressIndex] || {};
        const payload = {
          ...existingAddress,
          ...addressForm,
          name,
          phone: addressForm.phone,
        };
        updatedAddresses = await accountApi.updateAddress(addressIndex, payload);
        toast.success("Address updated successfully!");
      } else {
        updatedAddresses = await accountApi.addAddress({
          ...addressForm,
          name,
          phone: addressForm.phone,
        });
        toast.success("Address added successfully!");
      }

      setAddresses(withAddressIds(updatedAddresses));
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Address could not be saved.");
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="bg-white border border-gray-200 rounded-[24px] p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-brand-purple/5 mb-6">
          <div>
            <h2 className="text-xl font-bold text-brand-purple">
              Saved Delivery Addresses
            </h2>
            <p className="text-xs font-semibold text-brand-brown/60 mt-0.5">
              Manage your delivery addresses for quick checkout
            </p>
          </div>

          {!isAddingAddress && (
            <button
              onClick={() => {
                setAddressForm({
                  name: currentUser?.name || "",
                  phone: currentUser?.phone || "",
                  address: "",
                  city: "",
                  state: "",
                  zip: "",
                  country: "United States",
                });
                setIsAddingAddress(true);
              }}
              className="px-5 py-2.5 bg-brand-purple text-brand-cream hover:bg-brand-purple/90 rounded-full font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              Add New Address
            </button>
          )}
        </div>

        {isAddingAddress ? (
          <form
            onSubmit={handleAddressSubmit}
            noValidate
            className="max-w-xl space-y-4 bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm animate-in zoom-in-95 duration-200"
          >
            <h3 className="font-bold text-sm text-brand-purple mb-2">
              {editingAddressId ? "Edit Address Details" : "Add New Shipping Address"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-brand-purple uppercase tracking-wider">
                    Full Name
                  </label>
                  <span className="text-[9px] text-brand-brown/50">Min 2, Max 50 chars</span>
                </div>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  value={addressForm.name || ""}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, name: e.target.value })
                  }
                  placeholder="John Smith"
                  className={`w-full px-3.5 py-2.5 bg-[#FCF9F6] border ${
                    String(addressForm.name || "").trim().length > 0 &&
                    (String(addressForm.name || "").trim().length < 2 || String(addressForm.name || "").trim().length > 50)
                      ? "border-red-400 focus:border-red-500"
                      : "border-brand-purple/10 focus:border-brand-purple/45"
                  } rounded-xl text-brand-purple text-xs font-semibold outline-none transition-all`}
                />
                {String(addressForm.name || "").trim().length > 0 &&
                  (String(addressForm.name || "").trim().length < 2 || String(addressForm.name || "").trim().length > 50) && (
                    <span className="text-[10px] font-semibold text-red-500 mt-0.5 block">
                      Full name must be between 2 and 50 characters.
                    </span>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-brand-purple uppercase tracking-wider">
                    Phone Number
                  </label>
                  <span className="text-[9px] text-brand-brown/50">Exact 10 digits</span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={addressForm.phone || ""}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, phone: e.target.value })
                  }
                  placeholder="10 digit phone number"
                  className={`w-full px-3.5 py-2.5 bg-[#FCF9F6] border ${
                    String(addressForm.phone || "").trim().length > 0 &&
                    String(addressForm.phone || "").replace(/\D/g, "").length !== 10
                      ? "border-red-400 focus:border-red-500"
                      : "border-brand-purple/10 focus:border-brand-purple/45"
                  } rounded-xl text-brand-purple text-xs font-semibold outline-none transition-all`}
                />
                {String(addressForm.phone || "").trim().length > 0 &&
                  String(addressForm.phone || "").replace(/\D/g, "").length !== 10 && (
                    <span className="text-[10px] font-semibold text-red-500 mt-0.5 block">
                      Phone number must be exactly 10 digits.
                    </span>
                )}
              </div>

              {[
                ["address", "Address Line", "Street address, P.O. box, apt", 5, 100, "Min 5, Max 100 chars"],
                ["city", "City", "e.g. Austin", 2, 50, "Min 2, Max 50 chars"],
                ["state", "State / Province", "e.g. TX", 2, 50, "Min 2, Max 50 chars"],
                ["zip", "ZIP / Postal Code", "e.g. 78701", 3, 10, "Min 3, Max 10 chars"],
              ].map(([field, label, placeholder, minLen, maxLen, hint]) => {
                const val = String(addressForm[field] || "").trim();
                const isInvalid = val.length > 0 && (val.length < minLen || val.length > maxLen);
                return (
                  <div key={field}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-brand-purple uppercase tracking-wider">
                        {label}
                      </label>
                      <span className="text-[9px] text-brand-brown/50">{hint}</span>
                    </div>
                    <input
                      type="text"
                      required
                      minLength={minLen}
                      maxLength={maxLen}
                      value={addressForm[field] || ""}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, [field]: e.target.value })
                      }
                      placeholder={placeholder}
                      className={`w-full px-3.5 py-2.5 bg-[#FCF9F6] border ${
                        isInvalid
                          ? "border-red-400 focus:border-red-500"
                          : "border-brand-purple/10 focus:border-brand-purple/45"
                      } rounded-xl text-brand-purple text-xs font-semibold outline-none transition-all`}
                    />
                    {isInvalid && (
                      <span className="text-[10px] font-semibold text-red-500 mt-0.5 block">
                        Must be between {minLen} and {maxLen} characters.
                      </span>
                    )}
                  </div>
                );
              })}

              <div>
                <label className="block text-[10px] font-bold text-brand-purple uppercase tracking-wider mb-1.5">
                  Country
                </label>
                <CountryDropdown
                  value={addressForm.country || "United States"}
                  onChange={(c) =>
                    setAddressForm({ ...addressForm, country: c })
                  }
                />
              </div>
            </div>



            <div className="flex gap-2.5 pt-4 border-t border-brand-purple/5">
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-brand-cream font-bold rounded-full text-xs transition-all shadow-sm cursor-pointer"
              >
                Save Address
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 border border-gray-200 text-brand-purple font-bold rounded-full text-xs bg-white hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : addresses.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-brand-purple/10 rounded-[20px] bg-white">
            <MapPin className="w-10 h-10 text-brand-purple/30 mx-auto mb-2" />
            <p className="text-xs font-semibold text-brand-brown/70">
              No saved addresses found. Please add a new shipping address.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="border border-gray-200 p-5 rounded-[20px] relative bg-white flex flex-col justify-between min-h-[190px]"
              >
                <div>
                  {addr.isDefault && (
                    <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-purple/5 text-brand-purple text-[9px] font-extrabold tracking-wider uppercase border border-brand-purple/10">
                      Default
                    </div>
                  )}
                  <h4 className="font-extrabold text-brand-purple text-sm">{addr.name}</h4>
                  <p className="text-xs text-brand-brown/80 font-bold mt-2">{addr.address}</p>
                  <p className="text-xs text-brand-brown/80 font-bold">
                    {addr.city}, {addr.state} {addr.zip}
                  </p>
                  <p className="text-xs text-brand-brown/80 font-bold mt-1">{addr.country}</p>
                </div>
                <div className="flex gap-4 border-t border-brand-purple/5 pt-4 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAddressForm({
                        name: addr.name || "",
                        phone: addr.phone || currentUser?.phone || "",
                        address: addr.address || "",
                        city: addr.city || "",
                        state: addr.state || "",
                        zip: addr.zip || "",
                        country: addr.country || "United States",
                        isDefault: Boolean(addr.isDefault),
                      });
                      setEditingAddressId(addr.id);
                      setIsAddingAddress(true);
                    }}
                    className="text-xs font-bold text-brand-purple/80 hover:text-brand-purple cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
