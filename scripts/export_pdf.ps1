$docx = "F:\Nhom3_CNPM\Bao_cao_Chuong_1_Chuong_2.docx"
$pdf = "F:\Nhom3_CNPM\Bao_cao_Chuong_1_Chuong_2.pdf"

Write-Host "Opening Word COM object..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0 # wdAlertsNone

try {
    Write-Host "Opening document: $docx"
    $doc = $word.Documents.Open($docx, $false, $true)
    Write-Host "Document opened. Total paragraphs: $($doc.Paragraphs.Count)"
    Write-Host "Saving to PDF: $pdf"
    $doc.SaveAs([ref]$pdf, [ref]17) # 17 = wdFormatPDF
    $pageCount = $doc.ComputeStatistics(2) # 2 = wdStatisticPages
    Write-Host "PDF Export Succeeded! Total Pages: $pageCount"
    $doc.Close([ref]$false)
}
catch {
    Write-Host "An error occurred: $_"
}
finally {
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
