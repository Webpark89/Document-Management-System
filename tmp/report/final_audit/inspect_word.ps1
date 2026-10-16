param([string]$InputDoc,[string]$OutputPrefix,[switch]$SkipMap)
$ErrorActionPreference='Stop'
$word=$null
$doc=$null
try {
  $word=New-Object -ComObject Word.Application
  $word.Visible=$false
  $word.DisplayAlerts=0
  $doc=$word.Documents.Open($InputDoc.Replace('/','\'),$false,$true,$false)
  $doc.Repaginate()
  if(-not $SkipMap){
  $entries=[System.Collections.Generic.List[object]]::new()
  $n=0
  foreach($paragraph in $doc.Paragraphs) {
    $n++
    $text=$paragraph.Range.Text.Trim([char]13,[char]7,[char]10)
    if([string]::IsNullOrWhiteSpace($text)){continue}
    if($text -notmatch '^\s*(บทที่\s*\d|[1-7]\.\s|ตารางที่|ภาพที่|ภาพภาคผนวกที่|ภาคผนวก|เอกสารอ้างอิง|ประวัติการศึกษา)'){continue}
    $range=$paragraph.Range.Duplicate
    $leading=[regex]::Match($paragraph.Range.Text,'^\s*').Length
    $range.Start=$range.Start+$leading
    $range.Collapse(1)
    $entries.Add([pscustomobject]@{index=$n;text=$text;page=$range.Information(1);physical=$range.Information(3);inTable=$range.Information(12);start=$range.Start})
  }
  $entries | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath ($OutputPrefix+'_paragraphs.json') -Encoding utf8
  Write-Output ('PAGES='+$doc.ComputeStatistics(2)+' PARAGRAPHS='+$n)
  }
  $pdfPath=($OutputPrefix+'.pdf').Replace('/','\')
  $doc.ExportAsFixedFormat($pdfPath,17)
  Write-Output ('PDF='+$OutputPrefix+'.pdf')
} finally {
  if($null -ne $doc){$doc.Close(0)}
  if($null -ne $word){if($word.Documents.Count -eq 0){$word.Quit(0)};[void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($word)}
}
