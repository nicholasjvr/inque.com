"use server";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { firestoreAdmin } from "@/lib/firebaseAdmin";
import { requireUid } from "@/lib/session";
import { getResumableSignedUrl } from "@/lib/signer";

const Input = z.object({
  name: z.string().min(1),
  size: z.number().int().positive(),
  mime: z.string().min(1),
});

export async function getUploadUrl(input: unknown) {
  const { name, size, mime } = Input.parse(input);
  const uid = await requireUid(); // throws if no session cookie

  const id = uuid();
  const objectPath = `${uid}/${id}/${encodeURIComponent(name)}`;

  await firestoreAdmin().collection("files").doc(id).set({
    id,
    ownerUid: uid,
    name,
    size,
    mime,
    gcsPath: `gs://${process.env.GCP_BUCKET_UPLOAD}/${objectPath}`,
    uploadState: "requested",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const resumableUrl = await getResumableSignedUrl({
    bucket: process.env.GCP_BUCKET_UPLOAD!,
    object: objectPath,
    mime,
  });

  return { id, resumableUrl, objectPath };
}
