class CourierProvider {
  createShipment() {
    throw new Error("createShipment must be implemented");
  }

  trackShipment() {
    throw new Error("trackShipment must be implemented");
  }

  cancelShipment() {
    throw new Error("cancelShipment must be implemented");
  }

  generateLabel() {
    throw new Error("generateLabel must be implemented");
  }
}

module.exports = CourierProvider;
