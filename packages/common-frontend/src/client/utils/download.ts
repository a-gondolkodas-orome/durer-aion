// Hands the browser a file to save. The viewer's own download, so no server
// round trip.
export function downloadTsv(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/tab-separated-values' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  // Released on a later task, not in this one: a browser that reads the blob
  // asynchronously has not taken it yet when `click()` returns, and revoking
  // under it cancels the download — without throwing, so the caller's catch
  // never fires and the page reports a file it never saved.
  setTimeout(() => { URL.revokeObjectURL(url); }, 0);
}
