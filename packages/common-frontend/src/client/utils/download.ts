// Hands the browser a file to save. The viewer's own download, so no server
// round trip; the object URL is released once the click has taken it.
export function downloadTsv(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/tab-separated-values' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
