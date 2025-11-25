# Fix duplicate imports in all files
$files = Get-ChildItem -Path "e:\Projects\insightly\insightly\frontend" -Recurse -Include *.tsx,*.ts | Where-Object { 
    $_.FullName -notmatch '\\node_modules\\' -and 
    $_.FullName -notmatch '\\.next\\'
}

$fixedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Remove duplicate Spinner imports
    $lines = $content -split "`n"
    $seenSpinnerImport = $false
    $newLines = @()
    
    foreach ($line in $lines) {
        if ($line -match 'import.*\{.*Spinner.*\}.*from.*[''"]@/components/ui/spinner[''"]') {
            if (-not $seenSpinnerImport) {
                $newLines += $line
                $seenSpinnerImport = $true
            }
            # Skip duplicate imports
        } else {
            $newLines += $line
        }
    }
    
    $content = $newLines -join "`n"
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName $content -NoNewline
        $fixedCount++
        Write-Output "Fixed: $($file.FullName.Replace('e:\Projects\insightly\insightly\frontend\', ''))"
    }
}

Write-Output "`nTotal files fixed: $fixedCount"
