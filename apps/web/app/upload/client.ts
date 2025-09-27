export async function uploadResumable(args: { file: File; resumableUrl: string }) {
    const { file, resumableUrl } = args;
  
    // 1) Start resumable session
    const init = await fetch(resumableUrl, {
      method: "POST",
      headers: { "x-goog-resumable": "start", "Content-Type": file.type }
    });
    if (!init.ok) throw new Error("Failed to start resumable session");
    const sessionUrl = init.headers.get("location");
    if (!sessionUrl) throw new Error("Missing resumable session URL");
  
    // 2) Upload in chunks
    const chunkSize = 8 * 1024 * 1024; // 8MB
    let offset = 0;
    while (offset < file.size) {
      const end = Math.min(offset + chunkSize, file.size);
      const chunk = file.slice(offset, end);
  
      const resp = await fetch(sessionUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "Content-Range": `bytes ${offset}-${end - 1}/${file.size}`
        },
        body: chunk
      });
  
      // 308 = resume incomplete (continue), 200/201 = finished
      if (!(resp.status === 308 || resp.ok)) {
        throw new Error(`Chunk upload failed at offset ${offset}`);
      }
      offset = end;
    }
  }
  