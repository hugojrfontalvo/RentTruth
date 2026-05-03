const assert = require("node:assert/strict");
const { mkdtempSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");

const projectRoot = resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;

process.env.RENTTRUTH_ENABLE_DEMO_DATA = "false";
process.env.RENTTRUTH_DATA_FILE = join(
  mkdtempSync(join(tmpdir(), "renttruth-address-flow-")),
  "renttruth-db.json",
);

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      join(projectRoot, request.slice(2)),
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function loadTypeScript(module, filename) {
  const source = require("node:fs").readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

require.extensions[".tsx"] = require.extensions[".ts"];

test("tenant close address mismatch requires tenant confirmation before landlord approval", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { TenantJoinFieldsClient } = require("../components/tenant-join-fields-client.tsx");
  const {
    createPropertyForLandlord,
    createUser,
    findPropertyByJoinCode,
    formatTenantAddress,
    getPendingTenantsForProperty,
    getPropertyFullAddress,
    getPropertyServiceAddress,
    getSavedTenantAddress,
    getUsers,
    isClosePropertyAddressMatch,
    propertyAddressMatchesSavedAddress,
    propertyTypeRequiresUnit,
    saveTenantAddress,
    setTenantMembershipRequest,
  } = require("../lib/demo-data.ts");

  console.log("test: create landlord test user");
  const landlord = createUser({
    email: "landlord-address-flow-test@renttruth.test",
    password: "demo12345",
    role: "landlord",
    name: "Address Flow Landlord",
  });

  console.log("test: landlord creates property");
  const property = createPropertyForLandlord({
    landlordId: landlord.id,
    propertyType: "Apartment",
    streetAddress: "9646 SW 151st Ave",
    unitNumber: "Apt 303",
    buildingNumber: "Building 4",
    city: "Miami",
    state: "FL",
    zip: "33196",
    unitCount: 1,
  });
  const joinCode = property.joinCode;

  assert.equal(getPropertyFullAddress(property), "9646 SW 151st Ave, Apt 303 Building 4, Miami, FL 33196");
  assert.equal(findPropertyByJoinCode(joinCode)?.id, property.id);

  console.log("test: create tenant test user");
  const tenant = createUser({
    email: "tenant-address-flow-test@renttruth.test",
    password: "demo12345",
    role: "tenant",
    name: "Address Flow Tenant",
  });

  console.log("test: tenant saves close but not exact address");
  saveTenantAddress(tenant.id, {
    streetAddress: "9646 SW 151st Avenue",
    unitNumber: "303",
    buildingNumber: "4",
    city: "Miami",
    state: "FL",
    zip: "33196",
    propertyType: "Apartment",
  });

  const savedTenant = getUsers().find((user) => user.id === tenant.id);
  const savedAddress = getSavedTenantAddress(savedTenant);

  assert.ok(savedAddress, "tenant saved address should exist");
  assert.equal(savedAddress.streetAddress, "9646 SW 151st Avenue");
  assert.equal(savedAddress.unitNumber, "303");
  assert.equal(savedAddress.buildingNumber, "4");

  console.log("test: tenant dashboard saved address card renders");
  const savedAddressMarkup = renderToStaticMarkup(
    React.createElement(TenantJoinFieldsClient, {
      initialSavedAddress: savedAddress,
      initialJoinCode: joinCode,
    }),
  );

  assert.match(savedAddressMarkup, /Saved Address/);
  assert.match(savedAddressMarkup, /Street:/);
  assert.match(savedAddressMarkup, /9646 SW 151st Avenue/);
  assert.match(savedAddressMarkup, /Apartment \/ Unit:/);
  assert.match(savedAddressMarkup, /303/);
  assert.match(savedAddressMarkup, /Building:/);

  console.log("test: join code lookup result");
  const propertyFromJoinCode = findPropertyByJoinCode(joinCode);
  assert.equal(propertyFromJoinCode?.id, property.id);

  const exactMatch = propertyAddressMatchesSavedAddress(propertyFromJoinCode, savedAddress);
  const closeMatch = isClosePropertyAddressMatch(propertyFromJoinCode, savedAddress);

  console.log("test: address exact match", { exactMatch });
  console.log("test: address close mismatch", { closeMatch });

  assert.equal(exactMatch, false, "Ave vs Avenue should not auto-create approval");
  assert.equal(closeMatch, true, "Ave vs Avenue should be suggested as a close match");
  assert.equal(getPendingTenantsForProperty(property.id).length, 0);

  console.log("test: landlord suggested address shown");
  assert.equal(getPropertyServiceAddress(propertyFromJoinCode), "9646 SW 151st Ave, Apt 303 Building 4, Miami, FL 33196");
  assert.equal(formatTenantAddress(savedAddress), "9646 SW 151st Avenue, Apt 303 Building 4, Miami, FL 33196");

  console.log("test: tenant accepted landlord address");
  const landlordAddress = {
    streetAddress: propertyFromJoinCode.streetAddress,
    city: propertyFromJoinCode.city,
    state: propertyFromJoinCode.state,
    zip: propertyFromJoinCode.zip,
    propertyType: propertyFromJoinCode.propertyType,
    unitNumber: propertyTypeRequiresUnit(propertyFromJoinCode.propertyType)
      ? propertyFromJoinCode.unitNumber || savedAddress.unitNumber
      : undefined,
    buildingNumber: propertyTypeRequiresUnit(propertyFromJoinCode.propertyType)
      ? propertyFromJoinCode.buildingNumber || savedAddress.buildingNumber
      : undefined,
  };

  saveTenantAddress(tenant.id, landlordAddress);
  setTenantMembershipRequest({
    userId: tenant.id,
    propertyId: propertyFromJoinCode.id,
    savedAddress: formatTenantAddress(landlordAddress),
    savedStreetAddress: landlordAddress.streetAddress,
    savedCity: landlordAddress.city,
    savedState: landlordAddress.state,
    savedZip: landlordAddress.zip,
    savedPropertyType: propertyFromJoinCode.propertyType,
    unitNumber: landlordAddress.unitNumber,
    buildingNumber: landlordAddress.buildingNumber,
    requestedAt: "Today",
  });

  console.log("test: pending approval created");
  const pendingTenants = getPendingTenantsForProperty(property.id);
  const updatedTenant = getUsers().find((user) => user.id === tenant.id);

  assert.equal(pendingTenants.length, 1);
  assert.equal(pendingTenants[0].id, tenant.id);
  assert.equal(updatedTenant.savedStreetAddress, "9646 SW 151st Ave");
  assert.equal(updatedTenant.unitNumber, "303");
  assert.equal(updatedTenant.buildingNumber, "4");
  assert.equal(updatedTenant.membershipStatus, "Pending");
});
