import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { uploadDir } from "../config/paths.js";

const UPLOAD_BLOB_STORE = "phakathi-flow-uploads";

export function getStorageProvider() {
  if (process.env.STORAGE_PROVIDER) return process.env.STORAGE_PROVIDER;
  if (process.env.PHAKATHI_STORAGE === "netlify-blobs" || process.env.NETLIFY === "true") return "netlify-blobs";
  return "local";
}

export function isRemoteStorageProvider() {
  return ["netlify-blobs", "s3"].includes(getStorageProvider());
}

async function getUploadStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: UPLOAD_BLOB_STORE, consistency: "strong" });
}

export function safeUploadFilename(originalName = "upload.bin") {
  const extension = path.extname(originalName || "") || ".bin";
  return `${Date.now()}-${crypto.randomUUID()}${extension}`;
}

export async function saveUploadBuffer({ filename, buffer, contentType, originalName, publicBaseUrl }) {
  const provider = getStorageProvider();

  if (provider === "netlify-blobs") {
    const store = await getUploadStore();
    await store.set(`uploads/${filename}`, buffer, {
      metadata: {
        contentType: contentType || "application/octet-stream",
        originalName: originalName || filename,
        uploadedAt: new Date().toISOString(),
      },
    });
    return {
      provider,
      storage_key: `uploads/${filename}`,
      file_url: `/api/integrations/uploads/${filename}`,
    };
  }

  if (provider === "s3") {
    throw new Error("S3-compatible storage is configured but not yet connected. Set STORAGE_PROVIDER=local or netlify-blobs until S3 credentials and client wiring are complete.");
  }

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer);
  return {
    provider: "local",
    storage_key: filename,
    file_url: `${publicBaseUrl || ""}/uploads/${filename}`,
  };
}

export async function readUploadBuffer(filename) {
  const provider = getStorageProvider();
  if (provider === "netlify-blobs") {
    const store = await getUploadStore();
    const key = `uploads/${filename}`;
    const [data, metadata] = await Promise.all([
      store.get(key, { type: "arrayBuffer" }),
      store.getMetadata(key),
    ]);
    if (!data) return null;
    return {
      buffer: Buffer.from(data),
      contentType: metadata?.contentType || "application/octet-stream",
    };
  }
  if (provider === "s3") {
    throw new Error("S3-compatible storage is configured but not yet connected.");
  }
  return null;
}
