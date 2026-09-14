import React, { useState, useEffect } from "react";
import {
  PawPrint, Plus, Edit3, Trash2, X, Check,
  AlertTriangle, Pill, Calendar, Dna
} from "lucide-react";
import AccountLayout from "./AccountLayout";
import { AppContext } from "../../context/AppContext";
import { useContext } from "react";

const SPECIES = ["Dog", "Cat", "Bird", "Rabbit", "Guinea Pig", "Reptile", "Other"];
const EMPTY_FORM = {
  id: null,
  name: "",
  species: "Dog",
  breed: "",
  age: "",
  weight: "",
  allergies: "",
  medicines: "",
  notes: "",
};

const PetProfilesPage = () => {
  const { addToast } = useContext(AppContext);
  const [profiles, setProfiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vet_pet_profiles") || "[]"); }
    catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    localStorage.setItem("vet_pet_profiles", JSON.stringify(profiles));
  }, [profiles]);

  const openAdd = () => { setForm(EMPTY_FORM); setErrors({}); setShowForm(true); };
  const openEdit = (p) => { setForm({ ...p }); setErrors({}); setShowForm(true); };

  const validate = () => {
    const nextErrors = {};
    const nameVal = form.name.trim();
    if (!nameVal) {
      nextErrors.name = "Pet name is required.";
    } else if (nameVal.length < 2 || nameVal.length > 50) {
      nextErrors.name = "Pet name must be 2-50 characters.";
    }

    if (form.breed && form.breed.trim().length > 50) {
      nextErrors.breed = "Breed cannot exceed 50 characters.";
    }
    if (form.age && form.age.trim().length > 30) {
      nextErrors.age = "Age cannot exceed 30 characters.";
    }
    if (form.weight && form.weight.trim().length > 30) {
      nextErrors.weight = "Weight cannot exceed 30 characters.";
    }
    if (form.allergies && form.allergies.trim().length > 200) {
      nextErrors.allergies = "Allergies cannot exceed 200 characters.";
    }
    if (form.medicines && form.medicines.trim().length > 200) {
      nextErrors.medicines = "Medicines cannot exceed 200 characters.";
    }
    if (form.notes && form.notes.trim().length > 300) {
      nextErrors.notes = "Notes cannot exceed 300 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      addToast({ title: "Validation Error", message: "Please correct the highlighted pet profile errors.", type: "error" });
      return;
    }
    if (form.id) {
      setProfiles(prev => prev.map(p => p.id === form.id ? { ...form } : p));
      addToast({ title: "Profile Updated", message: `${form.name}'s profile has been saved.`, type: "cart" });
    } else {
      const newProfile = { ...form, id: Date.now().toString() };
      setProfiles(prev => [...prev, newProfile]);
      addToast({ title: "Pet Added", message: `${form.name} has been added to your profiles.`, type: "cart" });
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleDelete = (id) => {
    const pet = profiles.find(p => p.id === id);
    setProfiles(prev => prev.filter(p => p.id !== id));
    setDeleteId(null);
    addToast({ title: "Profile Removed", message: `${pet?.name || "Pet"}'s profile has been deleted.`, type: "wishlist" });
  };

  const SPECIES_EMOJIS = { Dog: "🐕", Cat: "🐈", Bird: "🦜", Rabbit: "🐇", "Guinea Pig": "🐹", Reptile: "🦎", Other: "🐾" };

  return (
    <AccountLayout title="Pet Medical Profiles" subtitle="Maintain health records for all your animals in one place.">
      <div className="flex justify-end mb-5">
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-300 cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" /> Add Pet Profile
        </button>
      </div>

      {profiles.length === 0 && !showForm ? (
        <div className="bg-white border border-[#D9E8F2] rounded-2xl shadow-sm p-16 text-center flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#EAF5FC] flex items-center justify-center">
            <PawPrint className="w-10 h-10 text-[#9FB3C8]" />
          </div>
          <h3 className="font-heading font-black text-xl text-[#102A43]">No pet profiles yet</h3>
          <p className="text-sm text-[#627D98] max-w-xs">Add your pets' medical profiles to streamline prescription requests and orders.</p>
          <button onClick={openAdd} className="mt-2 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 cursor-pointer">
            Add First Pet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((pet) => (
            <div key={pet.id} className="bg-white border border-[#D9E8F2] rounded-2xl shadow-sm overflow-hidden hover:border-[#0874C9]/30 hover:shadow-md transition-all duration-200">
              {/* Card header */}
              <div className="bg-gradient-to-r from-[#0B2D4F] to-[#0874C9] px-5 py-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl">
                  {SPECIES_EMOJIS[pet.species] || "🐾"}
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-black text-white text-base truncate">{pet.name}</p>
                  <p className="text-xs text-white/70">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  {pet.age && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#9FB3C8] shrink-0" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[#9FB3C8]">Age</p>
                        <p className="text-sm font-bold text-[#102A43]">{pet.age}</p>
                      </div>
                    </div>
                  )}
                  {pet.weight && (
                    <div className="flex items-center gap-2">
                      <Dna className="w-3.5 h-3.5 text-[#9FB3C8] shrink-0" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[#9FB3C8]">Weight</p>
                        <p className="text-sm font-bold text-[#102A43]">{pet.weight}</p>
                      </div>
                    </div>
                  )}
                </div>

                {pet.allergies && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-red-500">Allergies</span>
                    </div>
                    <p className="text-xs text-red-700 font-semibold">{pet.allergies}</p>
                  </div>
                )}

                {pet.medicines && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Pill className="w-3 h-3 text-blue-500" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-500">Current Medicines</span>
                    </div>
                    <p className="text-xs text-blue-700 font-semibold">{pet.medicines}</p>
                  </div>
                )}

                {pet.notes && (
                  <p className="text-xs text-[#627D98] bg-[#F7FAFC] border border-[#D9E8F2] rounded-xl px-3 py-2">{pet.notes}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => openEdit(pet)} className="flex items-center gap-1.5 text-xs font-bold text-[#0874C9] hover:bg-[#EAF5FC] px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(pet.id)} className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0B2D4F]/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#D9E8F2] overflow-hidden">
            <div className="bg-gradient-to-r from-[#0B2D4F] to-[#0874C9] px-6 py-4 flex items-center justify-between">
              <h3 className="font-heading font-black text-white text-lg">{form.id ? "Edit Pet Profile" : "New Pet Profile"}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
              {[
                { label: "Pet Name *", key: "name", placeholder: "Buddy", type: "text" },
                { label: "Breed", key: "breed", placeholder: "Golden Retriever", type: "text" },
                { label: "Age", key: "age", placeholder: "3 years", type: "text" },
                { label: "Weight", key: "weight", placeholder: "30 lbs / 13.6 kg", type: "text" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8] block mb-1.5">{label}</label>
                  <input
                    value={form[key]}
                    onChange={e => {
                      setForm(f => ({ ...f, [key]: e.target.value }));
                      if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
                    }}
                    placeholder={placeholder}
                    type={type}
                    className={`w-full bg-[#F7FAFC] border ${
                      errors[key] ? "border-red-400 bg-red-50/40 focus:border-red-500" : "border-[#D9E8F2] focus:border-[#0874C9]"
                    } focus:ring-2 focus:ring-[#0874C9]/20 rounded-xl px-4 py-3 text-sm text-[#102A43] outline-none transition-all placeholder:text-[#9FB3C8]`}
                  />
                  {errors[key] && <p className="text-[11px] font-bold text-red-500 mt-1">{errors[key]}</p>}
                </div>
              ))}

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8] block mb-1.5">Species</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIES.map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, species: s }))} type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${form.species === s ? "bg-[#0874C9] text-white border-[#0874C9]" : "border-[#D9E8F2] text-[#627D98] hover:border-[#0874C9]/40"}`}>
                      {SPECIES_EMOJIS[s]} {s}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: "Known Allergies", key: "allergies", placeholder: "e.g. Penicillin, Certain flea treatments..." },
                { label: "Current Medicines", key: "medicines", placeholder: "e.g. Apoquel 16mg daily, Heartgard monthly..." },
                { label: "Additional Notes", key: "notes", placeholder: "e.g. Has heart condition, needs low-sodium diet..." },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8] block mb-1.5">{label}</label>
                  <textarea
                    value={form[key]}
                    onChange={e => {
                      setForm(f => ({ ...f, [key]: e.target.value }));
                      if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
                    }}
                    placeholder={placeholder}
                    rows={2}
                    className={`w-full bg-[#F7FAFC] border ${
                      errors[key] ? "border-red-400 bg-red-50/40 focus:border-red-500" : "border-[#D9E8F2] focus:border-[#0874C9]"
                    } focus:ring-2 focus:ring-[#0874C9]/20 rounded-xl px-4 py-3 text-sm text-[#102A43] outline-none transition-all placeholder:text-[#9FB3C8] resize-none`}
                  />
                  {errors[key] && <p className="text-[11px] font-bold text-red-500 mt-1">{errors[key]}</p>}
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="flex-1 bg-[#0874C9] hover:bg-[#0B2D4F] text-white font-bold py-3 rounded-xl transition-all cursor-pointer">
                  Save Profile
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 border border-[#D9E8F2] text-[#627D98] font-bold py-3 rounded-xl transition-all cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0B2D4F]/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-[#D9E8F2] p-8 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-heading font-black text-xl text-[#102A43]">Delete Pet Profile?</h3>
            <p className="text-sm text-[#627D98]">This pet's medical profile will be permanently removed.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all cursor-pointer">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-[#D9E8F2] text-[#627D98] font-bold py-3 rounded-xl transition-all cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default PetProfilesPage;
