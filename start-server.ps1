$root = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\'
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')

try {
    $listener.Start()
} catch {
    Write-Host "Failed to start server on port 8080: $($_.Exception.Message)"
    exit 1
}

Write-Host 'Serving on http://localhost:8080'

function Get-ContentType($path) {
    switch ([IO.Path]::GetExtension($path).ToLower()) {
        '.html' { 'text/html' }
        '.js'   { 'application/javascript' }
        default { 'application/octet-stream' }
    }
}

while ($listener.IsListening) {
    $context = $null
    try {
        $context = $listener.GetContext()
        $response = $context.Response
        $status = 404
        $bytes = $null
        $type = 'text/plain'

        try {
            $urlPath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath)
            if ($urlPath -eq '/') { $urlPath = '/index.html' }
            $relative = $urlPath.TrimStart('/', '\')
            $full = [IO.Path]::GetFullPath((Join-Path $root $relative))
            if ($full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and
                (Test-Path -LiteralPath $full -PathType Leaf)) {
                $bytes = [IO.File]::ReadAllBytes($full)
                $type = Get-ContentType $full
                $status = 200
            }
        } catch {
            $status = 404
            $bytes = $null
        }

        if ($status -ne 200) {
            $type = 'text/plain'
            $bytes = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
        }

        $response.StatusCode = $status
        $response.ContentType = $type
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        $response.OutputStream.Close()
    } catch {
        # Keep serving after any per-request failure.
        if ($context) { try { $context.Response.Abort() } catch {} }
    }
}
