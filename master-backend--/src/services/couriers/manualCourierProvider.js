const CourierProvider = require("./courierProvider");

class ManualCourierProvider extends CourierProvider {
  async createShipment({ courierName, trackingNumber, awbNumber, trackingUrl }) {
    return {
      courierName,
      trackingNumber,
      awbNumber: awbNumber || null,
      trackingUrl: trackingUrl || null,
      provider: "manual",
    };
  }

  async trackShipment(order) {
    return {
      status: order.shipmentStatus,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
    };
  }

  async cancelShipment(order) {
    return { ...order, shipmentStatus: "Cancelled" };
  }

  async generateLabel(order) {
    return { labelUrl: null, orderId: order.id };
  }
}

module.exports = ManualCourierProvider;
