"use server";
import { firestoreAdmin } from "@/lib/firebaseAdmin";
import { requireUid } from "@/lib/session";
import { PubSub } from "@google-cloud/pubsub";

const pubsub = new PubSub();

export async function markUploaded(id: string) {
  const uid = await requireUid();

  const ref = firestoreAdmin().collection("files").doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("file not found");
  const meta = snap.data() as any;
  if (meta.ownerUid !== uid) throw new Error("forbidden");

  await ref.update({ uploadState: "uploaded", updatedAt: Date.now() });
  await pubsub.topic(process.env.PUBSUB_TOPIC_PROCESS_FILE!).publishMessage({ json: { id } });
  return { ok: true };
}
