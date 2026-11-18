$word = New-Object -ComObject Word.Application
$word.Visible = $false
$pdfPath = "F:\Nhom3_CNPM\docs\Product_Requirements_Document.pdf"
$txtPath = "F:\Nhom3_CNPM\scratch\prd_sample_extracted.txt"

try {
    Write-Output "Opening PDF in Word COM: $pdfPath"
    $doc = $word.Documents.Open($pdfPath, $false, $true)
    Write-Output "Word opened PDF! Converting to text..."
    $text = $doc.Content.Text
    [System.IO.File]::WriteAllText($txtPath, $text, [System.Text.Encoding]::UTF8)
    Write-Output "Saved extracted text to $txtPath. Length: $($text.Length) characters."
    $doc.Close($false)
} catch {
    Write-Error $_.Exception.Message
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
