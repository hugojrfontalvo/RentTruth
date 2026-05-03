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
  mkdtempSync(join(tmpdir(), "renttruth-dashboard-ticket-")),
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

function isOpenTicket(ticket) {
  return (
    ticket.status !== "Resolved" &&
    ticket.status !== "Closed" &&
    ticket.status !== "Ready for landlord payment approval" &&
    ticket.status !== "Tenant confirmed fixed"
  );
}

function unreadCount(ticket, role) {
  return (ticket.messages ?? []).filter((message) => message.senderRole !== role).length;
}

test("tenant and landlord active ticket queues and unread counts update with messages", () => {
  const {
    addLandlordTicketMessage,
    addTenantTicketMessage,
    createPropertyForLandlord,
    createTicketForTenant,
    createUser,
    getTicketsForProperty,
    getTicketsForTenant,
    updateTenantMembershipStatus,
  } = require("../lib/demo-data.ts");

  const landlord = createUser({
    email: "landlord-dashboard-ticket@renttruth.test",
    password: "demo12345",
    role: "landlord",
    name: "Dashboard Ticket Landlord",
  });
  const property = createPropertyForLandlord({
    landlordId: landlord.id,
    propertyType: "Apartment",
    streetAddress: "9646 SW 151st Ave",
    unitNumber: "303",
    city: "Miami",
    state: "FL",
    zip: "33196",
    unitCount: 1,
  });
  const tenant = createUser({
    email: "tenant-dashboard-ticket@renttruth.test",
    password: "demo12345",
    role: "tenant",
    name: "Dashboard Ticket Tenant",
  });
  tenant.propertyId = property.id;
  tenant.unitNumber = "303";
  updateTenantMembershipStatus(tenant.id, "Approved");

  const ticket = createTicketForTenant({
    tenantUserId: tenant.id,
    propertyId: property.id,
    tenantEmail: tenant.email,
    unitNumber: "303",
    issueTitle: "AC not cooling",
    category: "AC",
    description: "Air is blowing warm in the bedroom.",
    photoPlaceholder: "No photo uploaded",
    urgent: true,
  });

  const tenantActiveTickets = getTicketsForTenant(tenant.id).filter(isOpenTicket);
  const landlordActiveTickets = getTicketsForProperty(property.id).filter(isOpenTicket);

  assert.equal(tenantActiveTickets.length, 1);
  assert.equal(landlordActiveTickets.length, 1);
  assert.equal(tenantActiveTickets[0].issueTitle, "AC not cooling");
  assert.equal(landlordActiveTickets[0].issueTitle, "AC not cooling");

  addLandlordTicketMessage({
    ticketId: ticket.id,
    landlordUserId: landlord.id,
    messageText: "I am reviewing this now.",
  });
  const ticketAfterLandlordMessage = getTicketsForTenant(tenant.id)[0];

  assert.equal(unreadCount(ticketAfterLandlordMessage, "tenant"), 1);
  assert.equal(unreadCount(ticketAfterLandlordMessage, "landlord"), 0);

  addTenantTicketMessage({
    ticketId: ticket.id,
    tenantUserId: tenant.id,
    messageText: "Thank you. It is still warm.",
  });
  const ticketAfterTenantReply = getTicketsForProperty(property.id)[0];

  assert.equal(unreadCount(ticketAfterTenantReply, "tenant"), 1);
  assert.equal(unreadCount(ticketAfterTenantReply, "landlord"), 1);
});

test("ticket message form renders as no-page-reload client flow", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { TicketMessageThreadClient } = require("../components/ticket-message-thread-client.tsx");

  const markup = renderToStaticMarkup(
    React.createElement(TicketMessageThreadClient, {
      ticketId: "ticket-test",
      currentRole: "tenant",
      initialMessages: [],
      sendMessageAction: async () => null,
    }),
  );

  assert.match(markup, /data-no-page-reload="true"/);
  assert.match(markup, /Send Message/);
  assert.match(markup, /Write a message about this ticket/);
});

test("dashboard source keeps active ticket sections above lower ticket history/tools", () => {
  const tenantPage = readFileSync(join(projectRoot, "app/dashboard/tenant/page.tsx"), "utf8");
  const landlordPage = readFileSync(join(projectRoot, "app/dashboard/landlord/page.tsx"), "utf8");

  assert.ok(
    tenantPage.indexOf('id="active-tickets"') < tenantPage.indexOf('id="maintenance-request"'),
    "tenant active tickets should render before lower tenant tools",
  );
  assert.ok(
    landlordPage.indexOf("Active ticket needs attention") <
      landlordPage.indexOf("Create your first property"),
    "landlord active ticket shortcut should render near the top before setup sections",
  );
});
