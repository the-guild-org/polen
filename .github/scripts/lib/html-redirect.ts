/**
 * Create an HTML redirect page
 */
export function createHtmlRedirect(targetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0; url=${targetUrl}">
  <script>window.location.replace("${targetUrl}");</script>
</head>
<body>
  <p>Redirecting to <a href="${targetUrl}">${targetUrl}</a>...</p>
</body>
</html>`
}
