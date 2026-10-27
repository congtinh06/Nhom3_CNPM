$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = "F:\Nhom3_CNPM\FocusedUseCases (1).doc"
$outDir = "F:\Nhom3_CNPM\scratch\sample_focused_images"

try {
    if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir }
    $doc = $word.Documents.Open($docPath, $false, $true)
    Write-Output "Extracting shapes from FocusedUseCases (1).doc..."
    
    # Save as HTML to easily dump all embedded images
    $htmlPath = "F:\Nhom3_CNPM\scratch\sample_focused_html\focused.html"
    $htmlDir = "F:\Nhom3_CNPM\scratch\sample_focused_html"
    if (-not (Test-Path $htmlDir)) { New-Item -ItemType Directory -Path $htmlDir }
    
    $doc.SaveAs([ref]$htmlPath, [ref]8) # 8 = wdFormatHTML
    Write-Output "Saved doc as HTML, images dumped in $htmlDir"
    
    $doc.Close($false)
} catch {
    Write-Error $_.Exception.Message
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
