import React, { createContext, useContext, useState, useEffect } from "react";

const PrescriptionContext = createContext(null);

export function PrescriptionProvider({ children, modalComponent: ModalComponent }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    actionType: "add_to_cart", // 'add_to_cart' | 'buy_now' | 'checkout'
    product: null,
    quantity: 1,
    title: "",
    subtitle: "",
    onConfirm: null,
  });

  const [prescriptionData, setPrescriptionData] = useState(() => {
    try {
      const stored = sessionStorage.getItem("happypet_prescription_info");
      return stored
        ? JSON.parse(stored)
        : {
            fileName: "",
            filePreview: null,
            fileType: "",
            vetClinic: "",
            vetName: "",
            vetPhone: "",
            isUploadLater: false,
            uploadedAt: null,
            url: "",
            prescriptionUrl: "",
            urls: [],
            prescriptionUrls: [],
          };
    } catch {
      return {
        fileName: "",
        filePreview: null,
        fileType: "",
        vetClinic: "",
        vetName: "",
        vetPhone: "",
        isUploadLater: false,
        uploadedAt: null,
        url: "",
        prescriptionUrl: "",
        urls: [],
        prescriptionUrls: [],
      };
    }
  });

  useEffect(() => {
    try {
      if (
        prescriptionData &&
        (prescriptionData.fileName ||
          prescriptionData.isUploadLater ||
          prescriptionData.vetClinic ||
          prescriptionData.url ||
          prescriptionData.prescriptionUrl)
      ) {
        sessionStorage.setItem(
          "happypet_prescription_info",
          JSON.stringify(prescriptionData),
        );
      }
    } catch {
      // Storage error fallback
    }
  }, [prescriptionData]);

  const openPrescriptionModal = (config = {}) => {
    setModalConfig({
      actionType: config.actionType || "add_to_cart",
      product: config.product || null,
      quantity: config.quantity || 1,
      title: config.title || "",
      subtitle: config.subtitle || "",
      onConfirm: config.onConfirm || null,
    });
    setIsOpen(true);
  };

  const closePrescriptionModal = () => {
    setIsOpen(false);
  };

  const savePrescription = (data) => {
    let url = data.url || data.prescriptionUrl || "";
    if (!url && data.remoteData) {
      if (typeof data.remoteData === "string") {
        url = data.remoteData;
      } else if (data.remoteData?.url) {
        url = data.remoteData.url;
      } else if (Array.isArray(data.remoteData)) {
        const first = data.remoteData[0];
        url = typeof first === "string" ? first : first?.url || "";
      }
    }
    if (!url && Array.isArray(data.files)) {
      const firstFile = data.files[0];
      if (firstFile?.remoteData) {
        url =
          typeof firstFile.remoteData === "string"
            ? firstFile.remoteData
            : firstFile.remoteData?.url || "";
      }
    }

    let urls = data.urls || data.prescriptionUrls || [];
    if (!urls.length && url) {
      urls = [url];
    }

    const updated = {
      ...prescriptionData,
      ...data,
      url: url || prescriptionData?.url || "",
      prescriptionUrl: url || prescriptionData?.prescriptionUrl || "",
      urls: urls.length ? urls : prescriptionData?.urls || [],
      prescriptionUrls: urls.length ? urls : prescriptionData?.prescriptionUrls || [],
      uploadedAt: new Date().toISOString(),
    };
    setPrescriptionData(updated);
    try {
      sessionStorage.setItem(
        "happypet_prescription_info",
        JSON.stringify(updated),
      );
    } catch {
      // Storage fallback
    }
    return updated;
  };

  const clearPrescription = () => {
    const emptyData = {
      fileName: "",
      filePreview: null,
      fileType: "",
      vetClinic: "",
      vetName: "",
      vetPhone: "",
      isUploadLater: false,
      uploadedAt: null,
      url: "",
      prescriptionUrl: "",
      urls: [],
      prescriptionUrls: [],
      remoteData: null,
      files: [],
    };
    setPrescriptionData(emptyData);
    try {
      sessionStorage.removeItem("happypet_prescription_info");
      sessionStorage.removeItem("happypet_checkout_rx");
    } catch {
      // Storage fallback
    }
  };

  return (
    <PrescriptionContext.Provider
      value={{
        isOpen,
        modalConfig,
        prescriptionData,
        openPrescriptionModal,
        closePrescriptionModal,
        savePrescription,
        clearPrescription,
      }}
    >
      {children}
      {ModalComponent && <ModalComponent />}
    </PrescriptionContext.Provider>
  );
}

export function usePrescriptionModal() {
  const context = useContext(PrescriptionContext);
  if (!context) {
    throw new Error("usePrescriptionModal must be used within a PrescriptionProvider");
  }
  return context;
}
