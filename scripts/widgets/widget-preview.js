// scripts/widget-preview.js
export function previewWidget(indexHtmlUrl, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = `<iframe src="${indexHtmlUrl}" sandbox="allow-scripts allow-same-origin" style="width:100%;height:400px;border:none;"></iframe>`;
}
