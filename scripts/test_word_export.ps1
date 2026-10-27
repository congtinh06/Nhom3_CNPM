$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = "F:\Nhom3_CNPM\temp_ch1_ch2.docx"
$pdfPath = "F:\Nhom3_CNPM\temp_ch1_ch2.pdf"

try {
    Write-Output "Opening temp doc: $docPath"
    $doc = $word.Documents.Open($docPath)
    Write-Output "Opened! Updating TOC..."
    foreach ($toc in $doc.TablesOfContents) {
        $toc.Update()
    }
    Write-Output "Saving to PDF..."
    $doc.SaveAs([ref]$pdfPath, [ref]17)
    $pageCount = $doc.ComputeStatistics(2)
    Write-Output "PDF Export Succeeded! Total Pages: $pageCount"
    $doc.Close([ref]$false)
} catch {
    Write-Error $_.Exception.Message
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
