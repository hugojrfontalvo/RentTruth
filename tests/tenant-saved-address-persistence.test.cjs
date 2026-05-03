const assert = require("node:assert/strict");
const { mkdtempSync, readFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");

const projectRoot = resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;

process.env.RENTTRUTH_ENABLE_DEMO_DATA = "false";
process.env.RENTTRUTH_DATA_FILE = join(
  mkdtempSync(join(tmpdir(), "renttruth-tenant-address-")),
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

test("tenant saved address persists and renders after reload-style read", async () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { TenantJoinFieldsClient } = require("../components/tenant-join-fields-client.tsx");
  const {
    createUser,
    flushPersistentStore,
    getSavedTenantAddress,
    saveTenantAddress,
  } = require("../lib/demo-data.ts");

  const tenant = createUser({
    email: "tenant-saved-address-persist@renttruth.test",
    password: "demo12345",
    role: "tenant",
    name: "Saved Address Tenant",
  });

  saveTenantAddress(tenant.id, {
    streetAddress: "9646 SW 151st Avenue",
    unitNumber: "303",
    buildingNumber: "4",
    city: "Miami",
    state: "FL",
    zip: "33196-1221",
    propertyType: "Apartment",
  });
  await flushPersistentStore();

  const persistedStore = JSON.parse(readFileSync(process.env.RENTTRUTH_DATA_FILE, "utf8"));
  const persistedTenant = persistedStore.users.find((user) => user.id === tenant.id);

  assert.ok(persistedTenant, "tenant should be present in persisted store");
  assert.equal(persistedTenant.savedStreetAddress, "9646 SW 151st Avenue");
  assert.equal(persistedTenant.savedCity, "Miami");
  assert.equal(persistedTenant.savedState, "FL");
  assert.equal(persistedTenant.savedZip, "33196");
  assert.equal(persistedTenant.savedPropertyType, "Apartment");
  assert.equal(persistedTenant.unitNumber, "303");
  assert.equal(persistedTenant.buildingNumber, "4");

  const reloadedAddress = getSavedTenantAddress(persistedTenant);

  assert.ok(reloadedAddress, "dashboard loader should reconstruct the saved address");
  assert.equal(reloadedAddress.streetAddress, "9646 SW 151st Avenue");
  assert.equal(reloadedAddress.zip, "33196");
  assert.equal(reloadedAddress.unitNumber, "303");
  assert.equal(reloadedAddress.buildingNumber, "4");

  const markup = renderToStaticMarkup(
    React.createElement(TenantJoinFieldsClient, {
      initialSavedAddress: reloadedAddress,
      initialJoinCode: "",
    }),
  );

  assert.match(markup, /Saved Address/);
  assert.match(markup, /Street:/);
  assert.match(markup, /9646 SW 151st Avenue/);
  assert.match(markup, /Apartment \/ Unit:/);
  assert.match(markup, /303/);
  assert.match(markup, /Building:/);
  assert.match(markup, /4/);
  assert.match(markup, /City:/);
  assert.match(markup, /Miami/);
  assert.match(markup, /State:/);
  assert.match(markup, /FL/);
  assert.match(markup, /ZIP:/);
  assert.match(markup, /33196/);
  assert.match(markup, /Edit \/ Change Address/);
  assert.doesNotMatch(markup, /Save your address first to verify the code/);
  assert.doesNotMatch(markup, /Searching addresses/);
  assert.doesNotMatch(markup, /Select a suggestion/);
  assert.doesNotMatch(markup, /role="listbox"/);
});
