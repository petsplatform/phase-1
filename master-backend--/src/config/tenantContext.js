const { AsyncLocalStorage } = require("async_hooks");

const tenantContext = new AsyncLocalStorage();

function runWithTenant(context, callback) {
  return tenantContext.run(context, callback);
}

function getTenantContext() {
  return tenantContext.getStore() || null;
}

function getCurrentDb() {
  const context = getTenantContext();
  return context?.db || null;
}

function getCurrentStore() {
  const context = getTenantContext();
  return context?.store || null;
}

module.exports = {
  getCurrentDb,
  getCurrentStore,
  getTenantContext,
  runWithTenant,
};
