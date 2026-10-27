$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = "F:\Nhom3_CNPM\Bao_cao_Chuong_1_Chuong_2.docx"
$pdfPath = "F:\Nhom3_CNPM\Bao_cao_Chuong_1_Chuong_2.pdf"

try {
    Write-Output "Opening document in Word COM automation: $docPath ..."
    $doc = $word.Documents.Open($docPath)
    
    Write-Output "Updating all document fields and Tables of Contents..."
    foreach ($toc in $doc.TablesOfContents) {
        $toc.Update()
    }
    $doc.Fields.Update()
    $doc.Save()
    
    Write-Output "Exporting to PDF format: $pdfPath ..."
    $doc.SaveAs([ref]$pdfPath, [ref]17) # 17 = wdExportFormatPDF
    
    $pageCount = $doc.ComputeStatistics(2) # 2 = wdStatisticPages
    $wordCount = $doc.ComputeStatistics(0) # 0 = wdStatisticWords
    Write-Output "=================================================="
    Write-Output "WORD AUTOMATION REPORT:"
    Write-Output "PDF Export Succeeded!"
    Write-Output "PAGE_COUNT: $pageCount"
    Write-Output "WORD_COUNT: $wordCount"
    Write-Output "=================================================="
    
    $doc.Close([ref]$false)
} catch {
    Write-Error $_.Exception.Message
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
