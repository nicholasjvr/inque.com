import { Storage } from "@google-cloud/storage";

export async function getResumableSignedUrl(opts: {
  bucket: string;
  object: string;
  mime: string;
}) {
  const storage = new Storage();
  const [url] = await storage
    .bucket(opts.bucket)
    .file(opts.object)
    .createResumableUpload({
      metadata: { contentType: opts.mime, cacheControl: "private, max-age=0" }
    });
  return url; // session URL to use with POST x-goog-resumable:start, then chunked PUTs
}
