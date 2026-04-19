param(
  [Parameter(Mandatory = $true)][string]$DocxPath,
  [Parameter(Mandatory = $true)][string]$OutTxtPath
)
$ErrorActionPreference = 'Stop'
$tmp = Join-Path $env:TEMP ("docx_extract_" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  $zip = Join-Path $tmp 'doc.zip'
  Copy-Item -LiteralPath $DocxPath -Destination $zip
  Expand-Archive -LiteralPath $zip -DestinationPath (Join-Path $tmp 'out') -Force
  $xmlPath = Join-Path $tmp 'out\word\document.xml'
  [xml]$doc = Get-Content -LiteralPath $xmlPath -Encoding UTF8
  $ns = @{ w = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main' }
  $texts = Select-Xml -Xml $doc -Namespace $ns -XPath '//w:t' | ForEach-Object { $_.Node.InnerText }
  ($texts -join '') | Set-Content -LiteralPath $OutTxtPath -Encoding UTF8
}
finally {
  Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
