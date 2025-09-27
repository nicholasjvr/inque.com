"use client";
import { useRef, useState } from "react";
import { getUploadUrl } from "../actions/getUploadUrl";
import { markUploaded } from "../actions/markUploaded";
import { uploadResumable } from "./client";

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [log, setLog] = useState<string[]>([]);

  async function run() {
    const file = inputRef.current?.files?.[0];
    if (!file) { alert("Pick a file"); return; }

    setLog(l => [...l, `Selected: ${file.name} (${file.size} bytes)`]);

    const { id, resumableUrl } = await getUploadUrl({
      name: file.name,
      size: file.size,
      mime: file.type || "application/octet-stream"
    });

    setLog(l => [...l, `Got resumable URL. Uploading…`]);

    await uploadResumable({ file, resumableUrl });

    setLog(l => [...l, `Upload finished. Notifying server…`]);

    await markUploaded(id);

    setLog(l => [...l, `Done. File id=${id}`]);
  }

  return (
    <main style={{ display: "grid", gap: 16, maxWidth: 640, margin: "40px auto" }}>
      <h1>Direct-to-GCS Upload</h1>
      <input type="file" ref={inputRef} />
      <button onClick={run}>Upload</button>

      <section style={{ background: "#0b1220", color: "#9ad", padding: 12, borderRadius: 8 }}>
        <b>Logs</b>
        <ul>{log.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </section>
    </main>
  );
}
