$urls = @(
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11.7.1/dist/sweetalert2.all.min.js'
)

foreach ($u in $urls) {
    try {
        $wc = New-Object System.Net.WebClient
        $data = $wc.DownloadData($u)
        $hash = [System.Security.Cryptography.SHA384]::Create().ComputeHash($data)
        $b64 = [Convert]::ToBase64String($hash)
        Write-Output "URL: $u"
        Write-Output "sha384-$b64"
        Write-Output "----"
    }
    catch {
        Write-Output "ERROR fetching $u : $_"
    }
}