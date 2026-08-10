chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "doStitch") {
    stitchImages(message).then(dataUrl => {
      sendResponse({
        ok: true,
        jobId: message.jobId,
        dataUrl: dataUrl
      });
    }).catch(e => {
      console.error("Stitching error:", e);
      sendResponse({
        ok: false,
        jobId: message.jobId,
        error: e && e.message ? e.message : String(e)
      });
    });
    return true;
  }
});

async function stitchImages({ captures, width, height, viewportHeight, devicePixelRatio, imageFormat }) {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  // Adjust canvas size for devicePixelRatio
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;

  let drawnUntil = 0;
  for (let i = 0; i < captures.length; i++) {
    const capture = captures[i];
    const img = await loadImage(capture.dataUrl);
    const captureY = Math.max(0, Math.round(capture.y || 0));
    const captureHeight = capture.viewportHeight || viewportHeight || (img.height / devicePixelRatio);
    const sourceTop = Math.max(0, drawnUntil - captureY);
    const destinationY = captureY + sourceTop;
    const drawHeight = Math.min(captureHeight - sourceTop, height - destinationY);

    if (drawHeight <= 0) continue;

    ctx.drawImage(
      img,
      0,
      Math.floor(sourceTop * devicePixelRatio),
      img.width,
      Math.floor(drawHeight * devicePixelRatio),
      0,
      Math.floor(destinationY * devicePixelRatio),
      canvas.width,
      Math.floor(drawHeight * devicePixelRatio)
    );
    drawnUntil = Math.max(drawnUntil, destinationY + drawHeight);
  }

  const mimeType = imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
  return canvas.toDataURL(mimeType);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
