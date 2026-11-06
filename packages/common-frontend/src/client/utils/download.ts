/** Hands the browser a file to save: the viewer's own download, with no
 * server round trip. */
export function downloadTsv(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/tab-separated-values' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  // Released on a later task: a browser that reads the blob asynchronously has
  // not taken it yet when `click()` returns, and revoking under it cancels the
  // download without throwing.
  setTimeout(() => { URL.revokeObjectURL(url); }, 0);
}
