import { LockKeyhole, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import AddressCard from "../../components/account/AddressCard";
import AddressFormModal from "../../components/account/AddressFormModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { addAddress, deleteAddress, getAddresses, updateAddress } from "../../services/addressService";

export default function SavedAddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingAddress, setDeletingAddress] = useState(null);
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    getAddresses().then(setAddresses).catch(() => setAddressError("Could not load saved addresses."));
  }, []);

  const handleAddAddress = async (address) => {
    setAddressError("");
    try {
      const nextAddress = await addAddress(address);

      setAddresses((current) => {
        const normalized = nextAddress.isDefault ? current.map((item) => ({ ...item, isDefault: false })) : current;
        return normalized.concat(nextAddress);
      });
      setIsAddressModalOpen(false);
    } catch (error) {
      setAddressError(error.message || "Could not save address.");
      throw error;
    }
  };

  const handleUpdateAddress = async (address) => {
    if (!editingAddress) return;

    setAddressError("");
    try {
      const nextAddress = await updateAddress(editingAddress.index, address);
      setAddresses((current) => {
        const normalized = nextAddress.isDefault ? current.map((item) => ({ ...item, isDefault: false })) : current;
        return normalized.map((item) => (item.index === editingAddress.index ? nextAddress : item));
      });
      setEditingAddress(null);
      setIsAddressModalOpen(false);
    } catch (error) {
      setAddressError(error.message || "Could not update address.");
      throw error;
    }
  };

  const handleDeleteAddress = async (address) => {
    setDeletingAddress(address);
  };

  const confirmDeleteAddress = async () => {
    if (!deletingAddress) return;
    setAddressError("");
    try {
      const nextAddresses = await deleteAddress(deletingAddress.index);
      setAddresses(nextAddresses);
      setDeletingAddress(null);
    } catch (error) {
      setAddressError(error.message || "Could not delete address.");
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(false);
  };

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[34px] font-extrabold text-textMain">Saved Addresses</h1>
          <p className="mt-1 text-[14px] font-semibold text-muted">Manage your shipping addresses</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-secondaryDark px-5 text-[13px] font-extrabold text-white transition hover:bg-primaryDark"
        >
          <Plus size={16} /> Add New Address
        </button>
      </div>
      {addressError && <p className="mt-4 rounded-lg bg-sageLight px-4 py-3 text-[13px] font-extrabold text-error">{addressError}</p>}
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            onEdit={openEditModal}
            onDelete={handleDeleteAddress}
          />
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4 rounded-[14px] bg-sageLight p-5">
        <span className="grid size-12 place-items-center rounded-full bg-white text-secondaryDark"><LockKeyhole size={24} /></span>
        <p className="text-[13px] font-semibold"><strong className="block">Save time at checkout</strong>Add multiple addresses and choose the one that works best for you.</p>
      </div>
      <AddressFormModal
        open={isAddressModalOpen}
        onClose={closeAddressModal}
        onSubmit={editingAddress ? handleUpdateAddress : handleAddAddress}
        address={editingAddress}
      />
      <ConfirmModal
        open={Boolean(deletingAddress)}
        title="Delete saved address?"
        message="This address will be removed from your account and checkout address list."
        confirmText="Delete Address"
        tone="danger"
        onCancel={() => setDeletingAddress(null)}
        onConfirm={confirmDeleteAddress}
      />
    </section>
  );
}
