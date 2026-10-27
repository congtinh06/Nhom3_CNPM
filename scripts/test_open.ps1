$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$docPath = "F:\Nhom3_CNPM\Bao_cao_Chuong_1_Chuong_2.docx"
Write-Host "Testing open with parameters..."
try {
    # Open(FileName, ConfirmConversions, ReadOnly, AddToRecentFiles, PasswordDocument, PasswordTemplate, Revert, WritePasswordDocument, WritePasswordTemplate, Format, Encoding, Visible, OpenConflictDocument, OpenAndRepair, DocumentDirection, NoEncodingDialog)
    $doc = $word.Documents.Open($docPath, $false, $true, $false, [Type]::Missing, [Type]::Missing, $false, [Type]::Missing, [Type]::Missing, [Type]::Missing, [Type]::Missing, $false, [Type]::Missing, $true, [Type]::Missing, $true)
    Write-Host "Open succeeded! Paragraphs: $($doc.Paragraphs.Count)"
    $pdfPath = "F:\Nhom3_CNPM\Bao_cao_Chuong_1_Chuong_2.pdf"
    Write-Host "Saving PDF to $pdfPath..."
    $doc.SaveAs([ref]$pdfPath, [ref]17)
    Write-Host "PDF Saved successfully!"
    $doc.Close([ref]$false)
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    $word.Quit()
}
