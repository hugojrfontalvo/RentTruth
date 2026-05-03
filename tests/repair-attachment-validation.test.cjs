const assert = require("node:assert/strict");
const { resolve, join } = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");

const projectRoot = resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;

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
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

test("repair attachment validation accepts iPhone HEIC and HEIF uploads", () => {
  const { isSupportedRepairAttachment } = require("../lib/repair-attachment-validation.ts");

  assert.equal(isSupportedRepairAttachment({ fileName: "IMG_1001.HEIC", mimeType: "image/heic" }), true);
  assert.equal(isSupportedRepairAttachment({ fileName: "IMG_1002.HEIF", mimeType: "image/heif" }), true);
  assert.equal(isSupportedRepairAttachment({ fileName: "IMG_1003.HEIC", mimeType: "image/heic-sequence" }), true);
  assert.equal(isSupportedRepairAttachment({ fileName: "IMG_1004.HEIF", mimeType: "image/heif-sequence" }), true);
  assert.equal(isSupportedRepairAttachment({ fileName: "IMG_1005.HEIC", mimeType: "" }), true);
  assert.equal(isSupportedRepairAttachment({ fileName: "IMG_1006.HEIF", mimeType: "application/octet-stream" }), true);
});

test("repair attachment validation keeps existing supported formats", () => {
  const { isSupportedRepairAttachment } = require("../lib/repair-attachment-validation.ts");

  assert.equal(isSupportedRepairAttachment({ fileName: "repair.jpg", mimeType: "image/jpeg" }), true);
  assert.equal(isSupportedRepairAttachment({ fileName: "repair.jpeg", mimeType: "" }), true);
  assert.equal(isSupportedRepairAttachment({ fileName: "repair.png", mimeType: "image/png" }), true);
  assert.equal(isSupportedRepairAttachment({ fileName: "repair.pdf", mimeType: "application/pdf" }), true);
  assert.equal(isSupportedRepairAttachment({ fileName: "repair.txt", mimeType: "text/plain" }), false);
});
