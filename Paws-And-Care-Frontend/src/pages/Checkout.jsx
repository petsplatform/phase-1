import { useCallback, useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CheckoutStepper from '../components/checkout/CheckoutStepper';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { couponApi } from '../api/couponApi';
import { taxApi } from '../api/taxApi';
import StripePaymentElement from '../components/checkout/StripePaymentElement';
import PrescriptionUploadStep from '../components/checkout/PrescriptionUploadStep';
import CountryDropdown from '../components/common/CountryDropdown';
import { orderApi } from '../api/orderApi';
import { resolveCartItemProduct } from '../utils/cartVariants';
import { isVetOnly } from '../utils/productUtils';
import { normalizeAddressForApi, normalizePhone, splitCityStateZip } from '../utils/addressPayload';
import { CUSTOMER_BLOCKED_REASON_KEY } from '../api/axios';
import { 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  Check, 
  ChevronRight, 
  Lock, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronLeft,
  Tag,
  ShieldAlert
} from 'lucide-react';

const APPLIED_COUPON_KEY = 'paws_care_applied_coupon';
const BUY_NOW_STORAGE_KEY = 'paws_care_buy_now_checkout';

const readBuyNowItem = () => {
  try {
    const item = window.sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

export default function Checkout({ cart = [], onAddToCart, onRemoveFromCart, addToast, clearCartSilently, products = [] }) {
  const navigate = useNavigate();
  const { user, loginDemo, saveAddress, updateAddress, deleteAddress } = useAuth();
  const { placeOrder } = useOrders();
  const [buyNowItem, setBuyNowItem] = useState(() => readBuyNowItem());
  const isBuyNowCheckout = Boolean(buyNowItem);

  useEffect(() => {
    setBuyNowItem(readBuyNowItem());
  }, []);

  // Resolve Cart Items metadata
  const resolvedItems = useMemo(() => {
    const sourceItems = buyNowItem ? [buyNowItem] : cart;
    return sourceItems
      .map((item) => resolveCartItemProduct(item, products))
      .filter(Boolean);
  }, [buyNowItem, cart, products]);

  // Prescription required products filtering & step state
  const prescriptionRequiredItems = useMemo(() => {
    return resolvedItems.filter(
      (item) => Boolean(item.prescriptionRequired || item.product?.prescriptionRequired || item.requiresPrescription)
    );
  }, [resolvedItems]);

  const vetRestrictedItems = useMemo(() => {
    return resolvedItems.filter((item) => isVetOnly(item.product || item));
  }, [resolvedItems]);

  const hasVetRestriction = useMemo(() => {
    return Boolean(vetRestrictedItems.length > 0 && !user?.isVetVerified);
  }, [vetRestrictedItems, user]);

  const hasPrescriptionItems = prescriptionRequiredItems.length > 0;
  const paymentStepNumber = hasPrescriptionItems ? 4 : 3;

  // Prescription Upload State
  const [prescriptions, setPrescriptions] = useState({});
  const [prescriptionError, setPrescriptionError] = useState('');

  const handleUploadPrescription = async (item, file) => {
    const itemId = item.id || item.productId || item._id;
    setPrescriptions((prev) => ({
      ...prev,
      [itemId]: {
        file,
        fileName: file.name,
        status: 'uploading',
        error: null,
      },
    }));
    setPrescriptionError('');

    try {
      const data = await orderApi.uploadPrescription(file);
      const uploadedUrl = typeof data === 'string' ? data : (data?.url || data?.prescriptionUrl || data?.path || '');

      setPrescriptions((prev) => ({
        ...prev,
        [itemId]: {
          file,
          fileName: file.name,
          url: uploadedUrl,
          data,
          status: 'success',
          error: null,
        },
      }));
      if (addToast) {
        addToast(`Prescription uploaded for ${item.product?.name || item.name}`, 'success', 'Prescription Uploaded');
      }
    } catch (err) {
      console.error('Prescription upload failed:', err);
      const errMsg = err.message || 'Failed to upload prescription. Please try again.';
      setPrescriptions((prev) => ({
        ...prev,
        [itemId]: {
          file,
          fileName: file.name,
          status: 'error',
          error: errMsg,
        },
      }));
      if (addToast) {
        addToast(errMsg, 'error', 'Upload Failed');
      }
    }
  };

  const handleRemovePrescription = (itemId) => {
    setPrescriptions((prev) => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const handlePrescriptionStepContinue = () => {
    const missingItems = prescriptionRequiredItems.filter((item) => {
      const itemId = item.id || item.productId || item._id;
      const pres = prescriptions[itemId];
      return !pres || (pres.status !== 'success' && !pres.url);
    });

    if (missingItems.length > 0) {
      setPrescriptionError('Please upload a valid prescription for all required products before continuing to payment.');
      return;
    }

    setPrescriptionError('');
    setStep(4);
  };

  // Pricing calculations
  const subtotal = useMemo(() => {
    return resolvedItems.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);
  }, [resolvedItems]);

  // Step 3 Coupon & Discount Code states
  const [couponCode, setCouponCode] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(APPLIED_COUPON_KEY) || 'null')?.code || '';
    } catch {
      return '';
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(APPLIED_COUPON_KEY) || 'null')?.code || '';
    } catch {
      return '';
    }
  });
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxName, setTaxName] = useState('Estimated Tax');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  const shipping = 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = (taxableAmount * taxRate) / 100;
  const total = subtotal - discount + shipping + tax;

  // Stepper steps: 1 = Contact Details, 2 = Delivery Address, 3 = Payment
  const [step, setStep] = useState(1);

  // STEP 1 Form State (Contact Details)
  const [contactData, setContactData] = useState({
    fullName: '',
    email: '',
    mobile: ''
  });
  const [contactErrors, setContactErrors] = useState({});

  // STEP 2 Address List & Form State (Delivery Address)
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [addressForm, setAddressForm] = useState({
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    isDefault: false
  });
  const [addressErrors, setAddressErrors] = useState({});

  // STEP 3 Payment State
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardData, setCardData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');
  const [paymentErrors, setPaymentErrors] = useState({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [confirmStripePayment, setConfirmStripePayment] = useState(null);
  const [checkoutBlockedReason, setCheckoutBlockedReason] = useState(() => {
    const session = localStorage.getItem('paws_care_customer_session');
    if (!session) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      return '';
    }
    return localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY) || '';
  });

  useEffect(() => {
    if (!user) {
      setCheckoutBlockedReason('');
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    }
  }, [user]);

  useEffect(() => {
    taxApi
      .getActive()
      .then((activeTax) => {
        setTaxRate(Number(activeTax?.rate || 0));
        setTaxName(activeTax?.name || 'Estimated Tax');
      })
      .catch(() => {
        setTaxRate(0);
        setTaxName('Estimated Tax');
      });
  }, []);

  useEffect(() => {
    couponApi
      .list()
      .then((coupons) => setAvailableCoupons(Array.isArray(coupons) ? coupons : []))
      .catch(() => setAvailableCoupons([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    let savedCoupon = null;
    try {
      savedCoupon = JSON.parse(localStorage.getItem(APPLIED_COUPON_KEY) || 'null');
    } catch {
      savedCoupon = null;
    }
    if (!savedCoupon?.code || subtotal <= 0) return undefined;

    couponApi
      .validate(savedCoupon.code, subtotal, 0)
      .then((coupon) => {
        if (cancelled) return;
        const nextDiscount = Number(coupon.discountAmount || coupon.discount || 0);
        setAppliedCoupon(coupon.code);
        setCouponCode(coupon.code);
        setDiscount(nextDiscount);
        localStorage.setItem(APPLIED_COUPON_KEY, JSON.stringify({ ...coupon, discountAmount: nextDiscount }));
      })
      .catch(() => {
        if (cancelled) return;
        setAppliedCoupon('');
        setDiscount(0);
        localStorage.removeItem(APPLIED_COUPON_KEY);
      });

    return () => {
      cancelled = true;
    };
  }, [subtotal]);

  // Redirect if cart is empty
  useEffect(() => {
    if (buyNowItem && products.length === 0) return;
    if (resolvedItems.length === 0 && !isPlacingOrder && !orderPlaced) {
      navigate('/cart');
    }
  }, [buyNowItem, products.length, resolvedItems, navigate, isPlacingOrder, orderPlaced]);

  // Auto-fill and auto-forward to Step 2 if user is already logged in on mount
  const [autoForwarded, setAutoForwarded] = useState(false);
  useEffect(() => {
    if (user && !autoForwarded) {
      setContactData({
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email || '',
        mobile: user.mobile || ''
      });
      setStep(2);
      setAutoForwarded(true);
    }
  }, [user, autoForwarded]);

  // Sync selected index when user addresses change
  const savedAddresses = user?.addresses || [];
  useEffect(() => {
    if (savedAddresses.length > 0 && selectedAddressIndex >= savedAddresses.length) {
      setSelectedAddressIndex(0);
    }
  }, [savedAddresses, selectedAddressIndex]);

  // Custom contact validator with Full Name instead of separate first/last names
  const validateCheckoutContact = (fields) => {
    const errors = {};
    const name = (fields.fullName || '').trim();
    if (!name || name.length < 2 || name.length > 50) {
      errors.fullName = 'Full name must be between 2 and 50 characters';
    }
    if (!fields.email || !fields.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errors.email = 'Enter a valid email address';
    }
    const digits = (fields.mobile || '').replace(/\D/g, '');
    if (!fields.mobile || !fields.mobile.trim() || digits.length !== 10) {
      errors.mobile = 'Phone number must be exactly 10 digits';
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // STEP 1 Contact Submission (Silent Registration & Move to Step 2)
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (hasVetRestriction) {
      if (addToast) {
        addToast("Your order contains product(s) exclusive to verified veterinarians. Please complete vet verification before placing an order.", "error", "Verified Veterinarian Required");
      }
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }

    const validation = validateCheckoutContact(contactData);
    if (!validation.isValid) {
      setContactErrors(validation.errors);
      return;
    }
    setContactErrors({});
    if (checkoutBlockedReason) setCheckoutBlockedReason('');

    const names = contactData.fullName.trim().split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    try {
      await loginDemo({
        firstName,
        lastName,
        email: contactData.email,
        mobile: contactData.mobile,
        addresses: savedAddresses
      });
      setCheckoutBlockedReason('');
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      setStep(2);
    } catch (err) {
      const rawMsg = (err?.response?.data?.message || err?.message || "").toLowerCase();
      const isBlocked =
        Boolean(err?.response?.data?.isBlocked) ||
        rawMsg.includes("blocked") ||
        rawMsg.includes("deactivated") ||
        rawMsg.includes("suspended");
      const msg =
        err?.response?.data?.message ||
        (typeof err?.message === 'string' ? err.message : 'Your account has been blocked. Please contact support.');
      if (isBlocked) {
        setCheckoutBlockedReason(msg);
        localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, msg);
        if (addToast) addToast(msg, 'error', 'Account Blocked');
      } else {
        if (addToast) addToast(msg || 'Failed to verify contact details.', 'error', 'Error');
      }
    }
  };

  // Checkout address validator
  const validateCheckoutAddress = (fields) => {
    const errors = {};
    const name = (fields.fullName || '').trim();
    const phoneDigits = (fields.phoneNumber || '').replace(/\D/g, '');
    const street = (fields.streetAddress || '').trim();
    const city = (fields.city || '').trim();
    const state = (fields.state || '').trim();
    const zip = (fields.postalCode || '').trim();

    if (!name) {
      errors.fullName = 'Full name is required';
    } else if (name.length < 2 || name.length > 50) {
      errors.fullName = 'Full name must be between 2 and 50 characters';
    }

    if (!fields.phoneNumber || !fields.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (phoneDigits.length !== 10) {
      errors.phoneNumber = 'Phone number must be exactly 10 digits';
    }

    if (!street) {
      errors.streetAddress = 'Street address is required';
    } else if (street.length < 5 || street.length > 100) {
      errors.streetAddress = 'Street address must be between 5 and 100 characters';
    }

    if (!city) {
      errors.city = 'City is required';
    } else if (city.length < 2 || city.length > 50) {
      errors.city = 'City must be between 2 and 50 characters';
    }

    if (!state) {
      errors.state = 'State is required';
    } else if (state.length < 2 || state.length > 50) {
      errors.state = 'State must be between 2 and 50 characters';
    }

    if (!zip) {
      errors.postalCode = 'ZIP/Postal code is required';
    } else if (zip.length < 3 || zip.length > 10) {
      errors.postalCode = 'ZIP/Postal code must be between 3 and 10 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // STEP 2 Address Editing/Adding triggers
  const handleStartAddNewAddress = () => {
    const defaultName = contactData.fullName || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '');
    const defaultPhone = contactData.mobile || user?.mobile || '';
    setAddressForm({
      fullName: defaultName,
      phoneNumber: defaultPhone,
      streetAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      isDefault: false
    });
    setIsAddingNew(true);
    setEditingIndex(-1);
    setAddressErrors({});
  };

  const handleStartEditAddress = (idx) => {
    const address = savedAddresses[idx];
    setAddressForm({
      fullName: address.fullName || contactData.fullName || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''),
      phoneNumber: address.phoneNumber || address.phone || contactData.mobile || user?.mobile || '',
      streetAddress: address.streetAddress || address.addressLine1 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || address.zip || '',
      country: address.country || 'United States',
      isDefault: address.isDefault || false
    });
    setEditingIndex(idx);
    setIsAddingNew(false);
    setAddressErrors({});
  };

  const handleDeleteAddress = async (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this delivery destination?")) return;
    setDeletingIndex(idx);
    try {
      await deleteAddress(idx);
      if (addToast) addToast("Delivery destination removed successfully!", "success", "Address Removed");
      if (selectedAddressIndex === idx) {
        setSelectedAddressIndex(0);
      } else if (selectedAddressIndex > idx) {
        setSelectedAddressIndex((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
      if (addToast) addToast(err?.message || "Failed to delete address.", "error", "Error");
    } finally {
      setDeletingIndex(null);
    }
  };

  const handleSaveAddressForm = async (e) => {
    if (e) e.preventDefault();
    const validation = validateCheckoutAddress(addressForm);
    if (validation.isValid) {
      setAddressErrors({});

      const addressToSave = normalizeAddressForApi({
        fullName: addressForm.fullName,
        phoneNumber: addressForm.phoneNumber,
        streetAddress: addressForm.streetAddress,
        city: addressForm.city,
        state: addressForm.state,
        postalCode: addressForm.postalCode,
        country: addressForm.country || 'United States',
        isDefault: false
      }, { mobile: contactData.mobile });

      const isEdit = editingIndex !== -1 && savedAddresses[editingIndex];
      try {
        if (isEdit) {
          if (updateAddress) {
            await updateAddress(editingIndex, addressToSave);
          } else {
            const oldStreet = savedAddresses[editingIndex].streetAddress || savedAddresses[editingIndex].addressLine1;
            if (oldStreet && oldStreet !== addressForm.streetAddress) {
              await deleteAddress(oldStreet);
            }
            await saveAddress(addressToSave);
          }
        } else {
          await saveAddress(addressToSave);
        }

        setIsAddingNew(false);
        setEditingIndex(-1);
        setSelectedAddressIndex(0);
        if (addToast) {
          addToast(
            isEdit ? "Delivery destination updated successfully!" : "Address added and selected!",
            "success",
            "Address Saved"
          );
        }
      } catch (err) {
        console.error("Failed to save address:", err);
        if (addToast) addToast(err?.message || "Failed to save address.", "error", "Error");
      }
    } else {
      setAddressErrors(validation.errors);
    }
  };

  const handleAddressStepContinue = async () => {
    if (isAddingNew || editingIndex !== -1) {
      const validation = validateCheckoutAddress(addressForm);
      if (!validation.isValid) {
        setAddressErrors(validation.errors);
        return;
      }

      const addressToSave = normalizeAddressForApi({
        fullName: addressForm.fullName,
        phoneNumber: addressForm.phoneNumber,
        streetAddress: addressForm.streetAddress,
        city: addressForm.city,
        state: addressForm.state,
        postalCode: addressForm.postalCode,
        country: addressForm.country || 'United States',
        isDefault: false
      }, { mobile: contactData.mobile });

      const isEdit = editingIndex !== -1 && savedAddresses[editingIndex];
      try {
        if (isEdit) {
          if (updateAddress) {
            await updateAddress(editingIndex, addressToSave);
          } else {
            const oldStreet = savedAddresses[editingIndex].streetAddress || savedAddresses[editingIndex].addressLine1;
            if (oldStreet && oldStreet !== addressForm.streetAddress) {
              await deleteAddress(oldStreet);
            }
            await saveAddress(addressToSave);
          }
        } else {
          await saveAddress(addressToSave);
        }

        setIsAddingNew(false);
        setEditingIndex(-1);
        setSelectedAddressIndex(0);
      } catch (err) {
        console.error("Failed to save address:", err);
        if (addToast) addToast(err?.message || "Failed to save address.", "error", "Error");
        return;
      }
    } else {
      if (savedAddresses.length === 0) {
        handleStartAddNewAddress();
        return;
      }
    }
    setStep(3);
  };

  // STEP 3 Payment Form validation (No inputs to validate)
  const validatePayment = () => {
    if (!confirmStripePayment) {
      setPaymentErrors({ stripe: 'Secure payment form is still loading. Please wait a moment.' });
      return false;
    }
    setPaymentErrors({});
    return true;
  };

  const checkoutPayload = useMemo(
    () => ({
      amount: total,
      total,
      subtotal,
      discount,
      couponCode: appliedCoupon || undefined,
      promoDiscount: discount,
      shipping,
      tax,
      items: resolvedItems.map((item) => {
        const itemId = item.id || item.productId || item._id;
        const pres = prescriptions[itemId];
        return {
          productId: item.product.productId || item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          image: item.product.image,
          optionLabel: item.option ? 'Option' : undefined,
          selectedSize: item.option ? { label: item.option, price: item.product.price } : null,
          prescriptionUrl: pres?.url || undefined,
          prescriptionRequired: Boolean(item.prescriptionRequired || item.product?.prescriptionRequired || item.requiresPrescription),
        };
      }),
      prescriptions: Object.entries(prescriptions).map(([itemId, pres]) => ({
        itemId,
        url: pres.url,
        fileName: pres.fileName,
      })),
    }),
    [appliedCoupon, discount, prescriptions, resolvedItems, shipping, subtotal, tax, total],
  );

  const handleStripeReady = useCallback((confirmHandler) => {
    setConfirmStripePayment(() => confirmHandler);
  }, []);

  const getCouponLabel = (coupon) => {
    if (coupon.type === 'percentage') return `${coupon.value}% off`;
    return `$${Number(coupon.value || coupon.discountAmount || 0).toFixed(2)} off`;
  };

  // Apply Coupon code
  const applyCouponCode = async (code) => {
    setCouponError('');
    const cleanCode = String(code || '').trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const coupon = await couponApi.validate(cleanCode, subtotal, 0);
      const nextDiscount = Number(coupon.discountAmount || coupon.discount || 0);
      setAppliedCoupon(coupon.code);
      setDiscount(nextDiscount);
      localStorage.setItem(APPLIED_COUPON_KEY, JSON.stringify({ ...coupon, discountAmount: nextDiscount }));
      if (addToast) addToast(`${coupon.code} applied successfully.`, 'success', 'Coupon Applied');
    } catch (error) {
      setAppliedCoupon('');
      setDiscount(0);
      localStorage.removeItem(APPLIED_COUPON_KEY);
      setCouponError(error.message || 'Invalid coupon code.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    applyCouponCode(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setDiscount(0);
    setCouponCode('');
    setCouponError('');
    localStorage.removeItem(APPLIED_COUPON_KEY);
    if (addToast) addToast('Coupon removed.', 'info', 'Coupon Removed');
  };

  // STEP 3 Place Order Submission
  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;

    // Block order if user is blocked
    if (user) {
      const blockedCheck = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
      if (blockedCheck) {
        setCheckoutBlockedReason(blockedCheck);
        if (addToast) addToast(blockedCheck, 'error', 'Account Blocked');
        setStep(1);
        return;
      }
    } else {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      setCheckoutBlockedReason('');
    }

    if (!validatePayment()) return;

    setIsPlacingOrder(true);
    setCheckoutError('');

    try {
        const stripeResult = await confirmStripePayment();
        if (stripeResult?.error) {
          throw new Error(stripeResult.error.message || 'Payment could not be completed.');
        }
        const stripePaymentIntentId = stripeResult?.paymentIntent?.id;
        if (!stripePaymentIntentId || stripeResult?.paymentIntent?.status !== 'succeeded') {
          throw new Error('Payment was not completed. Please try again.');
        }

        const deliveryAddress = savedAddresses[selectedAddressIndex] || addressForm;
        if (!deliveryAddress || !(deliveryAddress.streetAddress || deliveryAddress.addressLine1)) {
          throw new Error('Delivery address is missing or incomplete.');
        }

        const names = (contactData.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`).trim().split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';

        if (!contactData.email) {
          throw new Error('Contact email is missing.');
        }

        const shippingAddress = normalizeAddressForApi(deliveryAddress, {
          fullName: contactData.fullName,
          mobile: contactData.mobile || user?.mobile,
          firstName,
          lastName,
        });

        const finalOrder = await placeOrder({
          ...checkoutPayload,
          shippingAddress,
          contactDetails: {
            firstName,
            lastName,
            email: contactData.email || (user && user.email) || '',
            mobile: contactData.mobile || (user && user.mobile) || ''
          },
          phone: contactData.mobile || (user && user.mobile) || '',
          email: contactData.email || (user && user.email) || '',
          firstName,
          lastName,
          paymentMethod: 'stripe',
          stripePaymentIntentId,
        });

        if (!finalOrder || !finalOrder.orderId) {
          throw new Error('Order creation failed. Please check details.');
        }

        // Set orderPlaced state to true first, to prevent empty cart redirect
        setOrderPlaced(true);

        window.sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
        setBuyNowItem(null);

        // Clear Cart Items state SILENTLY after successful cart checkout.
        if (!isBuyNowCheckout && clearCartSilently) {
          clearCartSilently();
        }

        setIsPlacingOrder(false);
        // Redirect to Order Success Page
        navigate(`/order-success/${finalOrder.orderId}`);
      } catch (err) {
        console.error('Error placing order:', err);
        const isBlocked =
          err?.response?.status === 403 ||
          Boolean(err?.response?.data?.isBlocked) ||
          (typeof err?.message === 'string' && err.message.toLowerCase().includes('blocked'));
        const errorMsg =
          err?.response?.data?.message ||
          (typeof err?.message === 'string' ? err.message : 'Failed to place order. Please review your details and try again.');
        if (isBlocked) {
          setCheckoutBlockedReason(errorMsg);
          localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, errorMsg);
          if (addToast) addToast(errorMsg, 'error', 'Account Blocked');
          setStep(1);
        } else {
          setCheckoutError(errorMsg);
          if (addToast) addToast(errorMsg, 'error', 'Error');
        }
        setIsPlacingOrder(false);
      }
  };

  // Custom Input Handlers
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardData({ ...cardData, cardNumber: value });
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    setCardData({ ...cardData, expiryDate: value.slice(0, 5) });
  };

  return (
    <div className="bg-brand-bg min-h-screen pb-16 font-sans">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-6 text-left">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-brand-muted mb-6 flex-wrap">
          <Link to="/" className="hover:text-brand-teal transition-colors">Home</Link>
          <ChevronRight size={10} className="text-brand-border" />
          <Link to="/cart" className="hover:text-brand-teal transition-colors">Cart</Link>
          <ChevronRight size={10} className="text-brand-border" />
          <span className="text-brand-coral font-semibold">Checkout</span>
        </nav>

        {/* Stepper Progress bar */}
        <CheckoutStepper currentStep={step} onStepClick={(s) => setStep(s)} hasPrescriptionStep={hasPrescriptionItems} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Form Step details (Left, 8 Cols) */}
          <div className="lg:col-span-8 order-2 lg:order-1 bg-white border border-brand-border/60 p-6 sm:p-8 rounded-[2rem] shadow-sm space-y-6">
            {hasVetRestriction && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm text-left">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-extrabold uppercase tracking-wider text-amber-800 text-xs">
                      Verified Veterinarian Required
                    </h4>
                    <p className="font-semibold text-amber-700 mt-0.5 text-xs">
                      Your order contains product(s) exclusive to verified veterinarians. Order placement is restricted until vet verification is approved.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(user ? "/profile?tab=vet-verification" : "/login")}
                  className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Apply for Verification
                </button>
              </div>
            )}

            {/* STEP 1 — CONTACT DETAILS */}
            {step === 1 && (
              <form onSubmit={handleContactSubmit} noValidate className="space-y-6">
                <div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text mb-1 flex items-center gap-2">
                    <Lock size={18} className="text-brand-teal" />
                    <span>Contact Details</span>
                  </h2>
                  <p className="font-sans text-xs sm:text-sm text-brand-muted">
                    Please provide your contact details to safely secure your order.
                  </p>
                </div>

                {/* Blocked Account Alert */}
                {checkoutBlockedReason && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-red-100 p-1.5 text-red-600 shrink-0 mt-0.5">
                        <ShieldAlert size={18} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-sm text-red-900">Account Blocked</h4>
                        <p className="text-xs font-sans font-bold text-red-700 mt-0.5">{checkoutBlockedReason}</p>
                        <p className="text-[10px] font-sans text-red-600 mt-1">Please contact customer support to resolve this issue.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Single Column Full Name */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <label htmlFor="fullName" className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                        Full Name *
                      </label>
                      <span className="text-[10px] text-brand-muted font-semibold">Min 2, Max 50 chars</span>
                    </div>
                    <input
                      type="text"
                      id="fullName"
                      minLength={2}
                      maxLength={50}
                      value={contactData.fullName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContactData({ ...contactData, fullName: val });
                        const trimmed = val.trim();
                        if (trimmed.length > 0 && (trimmed.length < 2 || trimmed.length > 50)) {
                          setContactErrors((prev) => ({ ...prev, fullName: "Full name must be between 2 and 50 characters" }));
                        } else {
                          setContactErrors((prev) => ({ ...prev, fullName: "" }));
                        }
                      }}
                      placeholder="e.g. John Smith"
                      className={`w-full px-4 py-2.5 rounded-xl border ${
                        contactErrors.fullName ||
                        (contactData.fullName.trim().length > 0 &&
                          (contactData.fullName.trim().length < 2 || contactData.fullName.trim().length > 50))
                          ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                          : "border-brand-border bg-brand-bg/10 focus:border-brand-teal focus:bg-white"
                      } focus:outline-none text-sm transition-all text-brand-text font-sans`}
                    />
                    {(contactErrors.fullName ||
                      (contactData.fullName.trim().length > 0 &&
                        (contactData.fullName.trim().length < 2 || contactData.fullName.trim().length > 50))) && (
                      <p className="text-[10px] text-brand-coral font-bold pl-1">
                        {contactErrors.fullName || "Full name must be between 2 and 50 characters"}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label htmlFor="email" className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                          Email Address *
                        </label>
                        <span className="text-[10px] text-brand-muted font-semibold">Valid email required</span>
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={contactData.email}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContactData({ ...contactData, email: val });
                          if (checkoutBlockedReason) setCheckoutBlockedReason('');
                          if (val.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                            setContactErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
                          } else {
                            setContactErrors((prev) => ({ ...prev, email: "" }));
                          }
                        }}
                        placeholder="e.g. hello@pawsandcare.com"
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          contactErrors.email ||
                          (contactData.email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email))
                            ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                            : "border-brand-border bg-brand-bg/10 focus:border-brand-teal focus:bg-white"
                        } focus:outline-none text-sm transition-all text-brand-text font-sans`}
                      />
                      {(contactErrors.email ||
                        (contactData.email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email))) && (
                        <p className="text-[10px] text-brand-coral font-bold pl-1">
                          {contactErrors.email || "Please enter a valid email address"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label htmlFor="mobile" className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                          Mobile Number *
                        </label>
                        <span className="text-[10px] text-brand-muted font-semibold">Exact 10 digits</span>
                      </div>
                      <input
                        type="tel"
                        id="mobile"
                        maxLength={10}
                        value={contactData.mobile}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContactData({ ...contactData, mobile: val });
                          const digits = val.replace(/\D/g, "");
                          if (val.trim().length > 0 && digits.length !== 10) {
                            setContactErrors((prev) => ({ ...prev, mobile: "Phone number must be exactly 10 digits" }));
                          } else {
                            setContactErrors((prev) => ({ ...prev, mobile: "" }));
                          }
                        }}
                        placeholder="10 digit phone number"
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          contactErrors.mobile ||
                          (contactData.mobile.trim().length > 0 && contactData.mobile.replace(/\D/g, "").length !== 10)
                            ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                            : "border-brand-border bg-brand-bg/10 focus:border-brand-teal focus:bg-white"
                        } focus:outline-none text-sm transition-all text-brand-text font-sans`}
                      />
                      {(contactErrors.mobile ||
                        (contactData.mobile.trim().length > 0 && contactData.mobile.replace(/\D/g, "").length !== 10)) && (
                        <p className="text-[10px] text-brand-coral font-bold pl-1">
                          {contactErrors.mobile || "Phone number must be exactly 10 digits"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-border/40">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full font-heading font-black text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>Continue to Delivery</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2 — DELIVERY ADDRESS */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text mb-1 flex items-center gap-2">
                    <Truck size={18} className="text-brand-teal" />
                    <span>Delivery Address</span>
                  </h2>
                  <p className="font-sans text-xs sm:text-sm text-brand-muted">
                    Select a saved delivery destination or add a new one.
                  </p>
                </div>

                {/* Saved Address Cards Grid */}
                {!isAddingNew && editingIndex === -1 && (
                  <div className="space-y-6">
                    {savedAddresses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedAddresses.map((address, idx) => {
                          const isSelected = selectedAddressIndex === idx;
                          const isDeleting = deletingIndex === idx;

                          return (
                            <div 
                              key={idx} 
                              onClick={() => setSelectedAddressIndex(idx)}
                              className={`p-5 rounded-2xl border-2 transition-all relative cursor-pointer ${
                                isSelected 
                                  ? 'border-brand-teal bg-brand-peach/20' 
                                  : 'border-brand-border bg-white hover:border-brand-teal/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <label className="flex items-start gap-3 cursor-pointer select-none flex-1 min-w-0">
                                  <input 
                                    type="radio" 
                                    name="selectedAddress" 
                                    checked={isSelected} 
                                    onChange={() => setSelectedAddressIndex(idx)}
                                    className="mt-1 h-4 w-4 text-brand-teal border-brand-border focus:ring-brand-teal accent-brand-teal"
                                  />
                                  <div className="space-y-1 text-xs sm:text-sm font-sans text-brand-muted min-w-0 flex-1">
                                    <strong className="block text-brand-text font-heading text-base font-black truncate">
                                      {address.fullName || `${user?.firstName} ${user?.lastName}`}
                                    </strong>
                                    {address.phoneNumber && (
                                      <p className="font-bold text-xs text-brand-text">{address.phoneNumber}</p>
                                    )}
                                    <p className="break-words">{address.streetAddress} {address.apartment && `, ${address.apartment}`}</p>
                                    <p>{address.city}, {address.state} {address.postalCode}</p>
                                    <p className="text-[11px] font-bold text-brand-text uppercase">{address.country || "United States"}</p>
                                  </div>
                                </label>

                                {/* Action buttons: Edit & Delete */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleStartEditAddress(idx);
                                    }}
                                    title="Edit delivery destination"
                                    className="p-2 rounded-xl text-brand-muted hover:text-brand-teal hover:bg-brand-teal/10 border border-transparent hover:border-brand-teal/20 transition-all cursor-pointer"
                                    aria-label="Edit address"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteAddress(e, idx)}
                                    disabled={isDeleting}
                                    title="Delete delivery destination"
                                    className="p-2 rounded-xl text-brand-muted hover:text-brand-coral hover:bg-brand-coral/10 border border-transparent hover:border-brand-coral/20 transition-all cursor-pointer disabled:opacity-50"
                                    aria-label="Delete address"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add New Address Card */}
                        <button
                          type="button"
                          onClick={handleStartAddNewAddress}
                          className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-brand-border hover:border-brand-teal text-brand-teal font-heading font-black text-sm bg-brand-bg/5 hover:bg-white transition-all cursor-pointer min-h-[140px]"
                        >
                          <Plus size={20} />
                          <span>Add New Address</span>
                        </button>
                      </div>
                    ) : (
                      // No saved addresses warning and trigger
                      <div className="text-center py-8 border-2 border-dashed border-brand-border rounded-[2rem] bg-brand-bg/10 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-brand-peach flex items-center justify-center text-brand-coral mx-auto">
                          <Truck size={22} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-heading font-black text-brand-text">No saved addresses found</h4>
                          <p className="text-xs text-brand-muted max-w-xs mx-auto">Please add your first delivery address to continue with checkout.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleStartAddNewAddress}
                          className="inline-flex items-center gap-1 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full px-5 py-2.5 font-heading font-bold text-xs transition-colors shadow-xs hover:shadow cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Add Address</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Add/Edit Address Form (Restructured to 1 vertical column matching the reference) */}
                {(isAddingNew || editingIndex !== -1) && (
                  <form onSubmit={handleSaveAddressForm} noValidate className="space-y-4 bg-brand-bg/25 border border-brand-border/40 p-5 sm:p-6 rounded-[2rem] text-left">
                    <h3 className="font-heading font-black text-lg text-brand-text border-b border-brand-border/40 pb-2 flex items-center justify-between">
                      <span>{editingIndex !== -1 ? 'Edit Delivery Address' : 'Enter New Address Details'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNew(false);
                          setEditingIndex(-1);
                          setAddressErrors({});
                        }}
                        className="text-xs text-brand-muted hover:text-brand-text font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </h3>

                    <div className="space-y-4">
                      {/* Full Name & Phone Number */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label htmlFor="fullName" className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                              Full Name *
                            </label>
                            <span className="text-[10px] text-brand-muted font-semibold">Min 2, Max 50 chars</span>
                          </div>
                          <input
                            type="text"
                            id="fullName"
                            minLength={2}
                            maxLength={50}
                            value={addressForm.fullName || ''}
                            onChange={(e) => {
                              setAddressForm({ ...addressForm, fullName: e.target.value });
                              if (addressErrors.fullName) setAddressErrors((prev) => ({ ...prev, fullName: undefined }));
                            }}
                            placeholder="John Smith"
                            className={`w-full px-4 py-2.5 rounded-xl border ${
                              addressErrors.fullName || ((addressForm.fullName || '').trim().length > 0 && ((addressForm.fullName || '').trim().length < 2 || (addressForm.fullName || '').trim().length > 50))
                                ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                                : "border-brand-border bg-white focus:border-brand-teal"
                            } text-brand-text text-sm focus:outline-none font-sans`}
                          />
                          {(addressErrors.fullName || ((addressForm.fullName || '').trim().length > 0 && ((addressForm.fullName || '').trim().length < 2 || (addressForm.fullName || '').trim().length > 50))) && (
                            <p className="text-[10px] text-brand-coral font-bold pl-1">
                              {addressErrors.fullName || "Full name must be between 2 and 50 characters."}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label htmlFor="phoneNumber" className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                              Phone Number *
                            </label>
                            <span className="text-[10px] text-brand-muted font-semibold">Exact 10 digits</span>
                          </div>
                          <input
                            type="tel"
                            id="phoneNumber"
                            maxLength={10}
                            value={addressForm.phoneNumber || ''}
                            onChange={(e) => {
                              setAddressForm({ ...addressForm, phoneNumber: e.target.value });
                              if (addressErrors.phoneNumber) setAddressErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                            }}
                            placeholder="10 digit phone number"
                            className={`w-full px-4 py-2.5 rounded-xl border ${
                              addressErrors.phoneNumber || ((addressForm.phoneNumber || '').trim().length > 0 && (addressForm.phoneNumber || '').replace(/\D/g, '').length !== 10)
                                ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                                : "border-brand-border bg-white focus:border-brand-teal"
                            } text-brand-text text-sm focus:outline-none font-sans`}
                          />
                          {(addressErrors.phoneNumber || ((addressForm.phoneNumber || '').trim().length > 0 && (addressForm.phoneNumber || '').replace(/\D/g, '').length !== 10)) && (
                            <p className="text-[10px] text-brand-coral font-bold pl-1">
                              {addressErrors.phoneNumber || "Phone number must be exactly 10 digits."}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Street Address */}
                      <div className="space-y-1.5 text-left">
                        <div className="flex justify-between items-center">
                          <label htmlFor="streetAddress" className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                            Street Address *
                          </label>
                          <span className="text-[10px] text-brand-muted font-semibold">Min 5, Max 100 chars</span>
                        </div>
                        <input
                          type="text"
                          id="streetAddress"
                          minLength={5}
                          maxLength={100}
                          value={addressForm.streetAddress || ''}
                          onChange={(e) => {
                            setAddressForm({ ...addressForm, streetAddress: e.target.value });
                            if (addressErrors.streetAddress) setAddressErrors((prev) => ({ ...prev, streetAddress: undefined }));
                          }}
                          placeholder="123 Paw Street"
                          className={`w-full px-4 py-2.5 rounded-xl border ${
                            addressErrors.streetAddress || ((addressForm.streetAddress || '').trim().length > 0 && ((addressForm.streetAddress || '').trim().length < 5 || (addressForm.streetAddress || '').trim().length > 100))
                              ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                              : "border-brand-border bg-white focus:border-brand-teal"
                          } text-brand-text text-sm focus:outline-none font-sans`}
                        />
                        {(addressErrors.streetAddress || ((addressForm.streetAddress || '').trim().length > 0 && ((addressForm.streetAddress || '').trim().length < 5 || (addressForm.streetAddress || '').trim().length > 100))) && (
                          <p className="text-[10px] text-brand-coral font-bold pl-1">
                            {addressErrors.streetAddress || "Street address must be between 5 and 100 characters."}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label htmlFor="city" className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                              City *
                            </label>
                            <span className="text-[10px] text-brand-muted font-semibold">Min 2, Max 50</span>
                          </div>
                          <input
                            type="text"
                            id="city"
                            minLength={2}
                            maxLength={50}
                            value={addressForm.city || ''}
                            onChange={(e) => {
                              setAddressForm({ ...addressForm, city: e.target.value });
                              if (addressErrors.city) setAddressErrors((prev) => ({ ...prev, city: undefined }));
                            }}
                            placeholder="Austin"
                            className={`w-full px-4 py-2.5 rounded-xl border ${
                              addressErrors.city || ((addressForm.city || '').trim().length > 0 && ((addressForm.city || '').trim().length < 2 || (addressForm.city || '').trim().length > 50))
                                ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                                : "border-brand-border bg-white focus:border-brand-teal"
                            } text-brand-text text-sm focus:outline-none font-sans`}
                          />
                          {(addressErrors.city || ((addressForm.city || '').trim().length > 0 && ((addressForm.city || '').trim().length < 2 || (addressForm.city || '').trim().length > 50))) && (
                            <p className="text-[10px] text-brand-coral font-bold pl-1">
                              {addressErrors.city || "City must be 2-50 chars."}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label htmlFor="state" className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                              State *
                            </label>
                            <span className="text-[10px] text-brand-muted font-semibold">Min 2, Max 50</span>
                          </div>
                          <input
                            type="text"
                            id="state"
                            minLength={2}
                            maxLength={50}
                            value={addressForm.state || ''}
                            onChange={(e) => {
                              setAddressForm({ ...addressForm, state: e.target.value });
                              if (addressErrors.state) setAddressErrors((prev) => ({ ...prev, state: undefined }));
                            }}
                            placeholder="TX"
                            className={`w-full px-4 py-2.5 rounded-xl border ${
                              addressErrors.state || ((addressForm.state || '').trim().length > 0 && ((addressForm.state || '').trim().length < 2 || (addressForm.state || '').trim().length > 50))
                                ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                                : "border-brand-border bg-white focus:border-brand-teal"
                            } text-brand-text text-sm focus:outline-none font-sans`}
                          />
                          {(addressErrors.state || ((addressForm.state || '').trim().length > 0 && ((addressForm.state || '').trim().length < 2 || (addressForm.state || '').trim().length > 50))) && (
                            <p className="text-[10px] text-brand-coral font-bold pl-1">
                              {addressErrors.state || "State must be 2-50 chars."}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <label htmlFor="postalCode" className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                              Postal Code *
                            </label>
                            <span className="text-[10px] text-brand-muted font-semibold">Min 3, Max 10</span>
                          </div>
                          <input
                            type="text"
                            id="postalCode"
                            minLength={3}
                            maxLength={10}
                            value={addressForm.postalCode || ''}
                            onChange={(e) => {
                              setAddressForm({ ...addressForm, postalCode: e.target.value });
                              if (addressErrors.postalCode) setAddressErrors((prev) => ({ ...prev, postalCode: undefined }));
                            }}
                            placeholder="78701"
                            className={`w-full px-4 py-2.5 rounded-xl border ${
                              addressErrors.postalCode || ((addressForm.postalCode || '').trim().length > 0 && ((addressForm.postalCode || '').trim().length < 3 || (addressForm.postalCode || '').trim().length > 10))
                                ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                                : "border-brand-border bg-white focus:border-brand-teal"
                            } text-brand-text text-sm focus:outline-none font-sans`}
                          />
                          {(addressErrors.postalCode || ((addressForm.postalCode || '').trim().length > 0 && ((addressForm.postalCode || '').trim().length < 3 || (addressForm.postalCode || '').trim().length > 10))) && (
                            <p className="text-[10px] text-brand-coral font-bold pl-1">
                              {addressErrors.postalCode || "ZIP must be 3-10 chars."}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                            Country *
                          </label>
                          <CountryDropdown
                            value={addressForm.country || "United States"}
                            dropUp={true}
                            onChange={(c) => setAddressForm({ ...addressForm, country: c })}
                            className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white focus:outline-none focus:border-brand-teal text-sm transition-all cursor-pointer flex items-center justify-between text-brand-text font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full font-heading font-bold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        {editingIndex !== -1 ? 'Update Address' : 'Save Address'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNew(false);
                          setEditingIndex(-1);
                          setAddressErrors({});
                        }}
                        className="px-5 py-2.5 bg-brand-bg hover:bg-brand-peach text-brand-text rounded-full font-heading font-bold text-xs border border-brand-border transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Safe info note at bottom of address step */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted pt-3 border-t border-brand-border/40 select-none">
                  <ShieldCheck size={14} className="text-brand-teal" />
                  <span>Your information is safe with us</span>
                </div>

                {/* Navigation actions */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-border hover:bg-brand-bg text-xs font-heading font-bold text-brand-text transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Back to Contact</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddressStepContinue}
                    className="inline-flex items-center gap-1.5 px-6 py-3 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full font-heading font-black text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>{hasPrescriptionItems ? 'Continue to Upload Prescription' : 'Continue to Payment'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — UPLOAD PRESCRIPTION (Rendered only if cart has prescription products) */}
            {step === 3 && hasPrescriptionItems && (
              <PrescriptionUploadStep
                items={prescriptionRequiredItems}
                prescriptions={prescriptions}
                onUpload={handleUploadPrescription}
                onRemove={handleRemovePrescription}
                onContinue={handlePrescriptionStepContinue}
                onBack={() => setStep(2)}
                validationError={prescriptionError}
              />
            )}

            {/* PAYMENT METHOD STEP */}
            {step === paymentStepNumber && (
              <div className="space-y-6">
                
                {/* Header & Subtitle */}
                <div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text mb-1">
                    Payment Method
                  </h2>
                  <p className="font-sans text-xs sm:text-sm text-brand-muted">
                    Paws & Care orders are processed with top-tier security standards.
                  </p>
                </div>

                {/* Single Premium Pay Online Radio Option Card */}
                <div className="p-5 rounded-2xl border-2 border-brand-teal bg-brand-peach/10 flex items-start gap-4">
                  <div className="mt-1 flex items-center justify-center">
                    <input 
                      type="radio" 
                      name="paymentOnlineMethod" 
                      checked={true}
                      readOnly
                      className="h-5 w-5 text-brand-teal focus:ring-brand-teal accent-brand-teal cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <strong className="block text-brand-text font-heading text-base font-black leading-tight">
                      Pay Online
                    </strong>
                  <p className="font-sans text-xs text-brand-muted leading-relaxed">
                      Secure card payment powered by Stripe.
                    </p>
                  </div>
                </div>

                <StripePaymentElement
                  active={step === paymentStepNumber}
                  total={total}
                  checkoutPayload={checkoutPayload}
                  onReady={handleStripeReady}
                />

                {paymentErrors.stripe && (
                  <div className="bg-brand-coral/10 border border-brand-coral/25 text-brand-coral px-4 py-2.5 rounded-xl text-xs font-semibold text-center select-none font-sans">
                    {paymentErrors.stripe}
                  </div>
                )}



                {checkoutError && (
                  <div className="bg-brand-coral/10 border border-brand-coral/25 text-brand-coral px-4 py-2.5 rounded-xl text-xs font-semibold text-center select-none font-sans">
                    {checkoutError}
                  </div>
                )}

                {/* Final step navigation buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-brand-border/40">
                  <button
                    type="button"
                    onClick={() => setStep(hasPrescriptionItems ? 3 : 2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-border hover:bg-brand-bg text-xs font-heading font-bold text-brand-text transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>{hasPrescriptionItems ? 'Back to Prescription' : 'Back to Delivery'}</span>
                  </button>
                   <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className={`inline-flex items-center gap-2 px-7 py-3 text-white rounded-full font-heading font-black text-sm transition-all shadow-md active:scale-95 cursor-pointer ${
                      isPlacingOrder ? 'bg-brand-coral/50 cursor-not-allowed' : 'bg-brand-coral hover:bg-brand-coral-dark'
                    }`}
                  >
                    <span>{isPlacingOrder ? 'Placing Order...' : 'Place Secure Order'}</span>
                    {isPlacingOrder ? (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Check size={16} />
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Checkout pricing summary (Right, 4 Cols) */}
          <div className="lg:col-span-4 order-1 lg:order-2">
            <CheckoutSummary 
              items={resolvedItems} 
              discount={discount} 
              setDiscount={setDiscount}
              appliedCoupon={appliedCoupon}
              setAppliedCoupon={setAppliedCoupon}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              addToast={addToast}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
