import express from "express";
import { Storage } from "@google-cloud/storage";
import { Firestore } from "@google-cloud/firestore";
import * as Sentry from "@sentry/node";
import sharp from "sharp";

Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();
app.use(express.json());

const storage = new Storage();
const db = new Firestore();

function parseGsPath(gsPath: string) {
  if (!gsPath?.startsWith("gs://")) throw new Error("expected gs:// path");
  const rest = gsPath.replace("gs://", "");
  const [bucket, ...parts] = rest.split("/");
  return { bucket, name: parts.join("/") };
}

app.post("/pubsub", async (req, res) => {
  try {
    const raw = req.body?.message?.data
      ? Buffer.from(req.body.message.data, "base64").toString()
      : "{}";
    const msg = JSON.parse(raw);
    const id = msg.id as string;
    if (!id) throw new Error("missing id");

    const ref = db.collection("files").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("file not found");
    const meta = snap.data() as any;

    await ref.update({ uploadState: "processing", updatedAt: Date.now() });

    const { bucket, name } = parseGsPath(meta.gcsPath);
    const file = storage.bucket(bucket).file(name);
    const [buf] = await file.download();

    if (typeof meta.mime === "string" && meta.mime.startsWith("image/")) {
      const thumb800 = await sharp(buf).rotate().resize({ width: 800, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
      const small256 = await sharp(buf).rotate().resize({ width: 256, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();

      const base = name.replace(/([^/]+)$/, "");
      const p800 = `${base}variants/thumb_800.jpg`;
      const p256 = `${base}variants/thumb_256.webp`;

      await storage.bucket(bucket).file(p800).save(thumb800, {
        resumable: false,
        metadata: { contentType: "image/jpeg", cacheControl: "public, max-age=31536000, immutable" }
      });

      await storage.bucket(bucket).file(p256).save(small256, {
        resumable: false,
        metadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" }
      });

      await ref.update({
        uploadState: "ready",
        updatedAt: Date.now(),
        variants: [
          { key: "thumb_800_jpg", gcsPath: `gs://${bucket}/${p800}`, size: thumb800.length },
          { key: "thumb_256_webp", gcsPath: `gs://${bucket}/${p256}`, size: small256.length }
        ]
      });
    } else {
      await ref.update({ uploadState: "ready", updatedAt: Date.now() });
    }

    res.status(204).end();
  } catch (err) {
    Sentry.captureException(err);
    console.error("[worker] error", err);
    res.status(500).end(); // let Pub/Sub retry / send to DLQ
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`worker listening :${port}`));
