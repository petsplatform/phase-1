import { addressApi } from "../api/addressApi";

export function getAddresses() {
  return addressApi.getAddresses();
}

export function addAddress(address) {
  return addressApi.addAddress(address);
}

export function updateAddress(index, address) {
  return addressApi.updateAddress(index, address);
}

export function deleteAddress(index) {
  return addressApi.deleteAddress(index);
}
