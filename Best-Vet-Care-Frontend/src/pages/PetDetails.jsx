import { useCallback, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import AccountLayout from "../components/account/AccountLayout";
import ConfirmModal from "../components/common/ConfirmModal";
import { accountApi } from "../api/accountApi";
import { useToast } from "../context/ToastContext";

const emptyForm = {
  name: "",
  species: "",
  breed: "",
  age: "",
  weight: "",
  gender: "",
  neuteredSpayed: null,
  medicalConditions: "",
  allergies: "",
  currentMedications: "",
  vaccinationInfo: "",
};

const listText = (items) => (Array.isArray(items) && items.length ? items.join(", ") : "None listed");
const listToText = (items) => (Array.isArray(items) ? items.join(", ") : "");

export default function PetDetails() {
  const { showToast } = useToast();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [deletePet, setDeletePet] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadPets = useCallback(() => {
    setLoading(true);
    accountApi
      .getPets()
      .then(setPets)
      .catch((error) => showToast(error.response?.data?.message || "Could not load pet details", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const startAdd = () => {
    setEditingPet(null);
    setForm(emptyForm);
  };

  const startEdit = (pet) => {
    setEditingPet(pet);
    setForm({
      name: pet.name || "",
      species: pet.species || "",
      breed: pet.breed || "",
      age: pet.age || "",
      weight: pet.weight || "",
      gender: pet.gender || "",
      neuteredSpayed: pet.neuteredSpayed,
      medicalConditions: listToText(pet.medicalConditions),
      allergies: listToText(pet.allergies),
      currentMedications: listToText(pet.currentMedications),
      vaccinationInfo: pet.vaccinationInfo || "",
    });
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const savePet = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.species.trim()) {
      showToast("Pet name and species are required", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        neuteredSpayed: form.neuteredSpayed === "" ? null : form.neuteredSpayed,
      };
      const saved = editingPet
        ? await accountApi.updatePet(editingPet.id, payload)
        : await accountApi.addPet(payload);
      setPets((current) => editingPet
        ? current.map((pet) => (pet.id === saved.id ? saved : pet))
        : [saved, ...current]);
      setEditingPet(null);
      setForm(emptyForm);
      showToast(editingPet ? "Pet details updated" : "Pet added");
    } catch (error) {
      showToast(error.response?.data?.message || "Could not save pet details", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletePet) return;
    try {
      await accountApi.removePet(deletePet.id);
      setPets((current) => current.filter((pet) => pet.id !== deletePet.id));
      setDeletePet(null);
      showToast("Pet removed");
    } catch (error) {
      showToast(error.response?.data?.message || "Could not remove pet", "error");
    }
  };

  return (
    <AccountLayout
      title="Pet Details"
      description="Keep pet profiles, care notes, allergies, medications, and vaccination details together."
      actions={
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#17345f] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#d9aa3d]"
        >
          <Plus className="h-4 w-4" />
          Add Pet
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-[#17345f1a] bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-sm font-bold text-[#122a50b2]">Loading pet details...</div>
          ) : pets.length ? (
            <div className="divide-y divide-[#17345f1a]">
              {pets.map((pet) => (
                <article key={pet.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-[#122a50]">{pet.name}</h2>
                      <p className="mt-1 text-sm font-bold text-[#122a50b2]">
                        {[pet.species, pet.breed, pet.age, pet.weight].filter(Boolean).join(" - ")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(pet)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#17345f1a] text-[#17345f] hover:bg-[#f8f1df]"
                        aria-label={`Edit ${pet.name}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePet(pet)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                        aria-label={`Remove ${pet.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm font-semibold text-[#122a50] md:grid-cols-2">
                    <Info label="Gender" value={pet.gender || "Not set"} />
                    <Info label="Spayed/Neutered" value={pet.neuteredSpayed === null || pet.neuteredSpayed === undefined ? "Not set" : pet.neuteredSpayed ? "Yes" : "No"} />
                    <Info label="Medical Conditions" value={listText(pet.medicalConditions)} />
                    <Info label="Allergies" value={listText(pet.allergies)} />
                    <Info label="Medications" value={listText(pet.currentMedications)} />
                    <Info label="Vaccination Info" value={pet.vaccinationInfo || "Not listed"} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <h2 className="text-lg font-extrabold text-[#122a50]">No pets saved yet</h2>
              <p className="mt-2 text-sm font-semibold text-[#122a50b2]">Add your pet profile to keep care details handy.</p>
            </div>
          )}
        </section>

        <form onSubmit={savePet} className="rounded-lg border border-[#17345f1a] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold text-[#122a50]">{editingPet ? "Edit Pet" : "Add Pet"}</h2>
          <div className="mt-4 grid gap-4">
            <Field name="name" label="Pet name *" value={form.name} onChange={updateField} />
            <Field name="species" label="Species *" value={form.species} onChange={updateField} placeholder="Dog, cat, bird..." />
            <Field name="breed" label="Breed" value={form.breed} onChange={updateField} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="age" label="Age" value={form.age} onChange={updateField} />
              <Field name="weight" label="Weight" value={form.weight} onChange={updateField} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="gender" label="Gender" value={form.gender} onChange={updateField} />
              <label className="block">
                <span className="text-xs font-extrabold uppercase text-[#122a50b2]">Spayed/Neutered</span>
                <select
                  name="neuteredSpayed"
                  value={form.neuteredSpayed === null || form.neuteredSpayed === undefined ? "" : String(form.neuteredSpayed)}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    neuteredSpayed: event.target.value === "" ? null : event.target.value === "true",
                  }))}
                  className="mt-1 h-12 w-full rounded-lg border border-[#17345f1a] bg-white px-3 text-sm font-semibold text-[#122a50] outline-none focus:border-[#d9aa3d]"
                >
                  <option value="">Not set</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
            </div>
            <Field name="medicalConditions" label="Medical conditions" value={form.medicalConditions} onChange={updateField} textarea />
            <Field name="allergies" label="Allergies" value={form.allergies} onChange={updateField} textarea />
            <Field name="currentMedications" label="Current medications" value={form.currentMedications} onChange={updateField} textarea />
            <Field name="vaccinationInfo" label="Vaccination info" value={form.vaccinationInfo} onChange={updateField} textarea />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#d9aa3d] disabled:opacity-60">
              {saving ? "Saving..." : editingPet ? "Save Pet" : "Add Pet"}
            </button>
            {editingPet && (
              <button type="button" onClick={startAdd} className="rounded-lg border border-[#17345f1a] px-5 py-3 text-sm font-extrabold text-[#17345f] hover:bg-[#f8f1df]">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <ConfirmModal
        open={Boolean(deletePet)}
        title="Remove pet?"
        message={`Remove ${deletePet?.name || "this pet"} from your account?`}
        confirmLabel="Remove"
        onCancel={() => setDeletePet(null)}
        onConfirm={confirmDelete}
      />
    </AccountLayout>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-[#fffdf7] p-3">
      <span className="block text-[10px] font-extrabold uppercase text-[#122a5080]">{label}</span>
      <span className="mt-1 block text-sm font-bold text-[#122a50]">{value}</span>
    </div>
  );
}

function Field({ name, label, value, onChange, placeholder = "", textarea = false }) {
  const className = "mt-1 w-full rounded-lg border border-[#17345f1a] px-3 text-sm font-semibold text-[#122a50] outline-none focus:border-[#d9aa3d]";
  return (
    <label className="block">
      <span className="text-xs font-extrabold uppercase text-[#122a50b2]">{label}</span>
      {textarea ? (
        <textarea name={name} value={value} onChange={onChange} rows={3} placeholder={placeholder} className={`${className} py-3`} />
      ) : (
        <input name={name} value={value} onChange={onChange} placeholder={placeholder} className={`${className} h-12`} />
      )}
    </label>
  );
}
