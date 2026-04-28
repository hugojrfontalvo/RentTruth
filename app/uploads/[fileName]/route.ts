import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getUploadFilePath, uploadFileExists } from "@/lib/upload-storage";

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

function getContentType(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return contentTypes[extension] ?? "application/octet-stream";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> },
) {
  const { fileName } = await params;
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "");

  if (!safeFileName || safeFileName !== fileName || !uploadFileExists(safeFileName)) {
    return new NextResponse("Attachment not found", { status: 404 });
  }

  const file = await readFile(getUploadFilePath(safeFileName));

  return new NextResponse(file, {
    headers: {
      "Content-Type": getContentType(safeFileName),
      "Content-Disposition": `inline; filename="${safeFileName}"`,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
