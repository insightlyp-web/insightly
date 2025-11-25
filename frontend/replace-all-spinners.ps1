# PowerShell script to replace ALL default spinners with Spinner component
$files = Get-ChildItem -Path "e:\Projects\insightly\insightly\frontend" -Recurse -Include *.tsx,*.ts | Where-Object { 
    $_.FullName -notmatch '\\node_modules\\' -and 
    $_.FullName -notmatch '\\.next\\' -and
    $_.FullName -notmatch '\\components\\ui\\spinner.tsx'
}

$replacementCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Add import if file contains spinner but doesn't have import
    if ($content -match 'animate-spin' -and $content -notmatch 'import.*Spinner.*from.*@/components/ui/spinner') {
        # Find the last import statement
        if ($content -match '(?s)(.*)(import.*from.*[''"].*;)') {
            $content = $content -replace '(import.*from.*[''"].*;)', "`$1`nimport { Spinner } from `"@/components/ui/spinner`";"
        }
    }
    
    # Replace all variations of default spinners
    # Pattern 1: inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600
    $content = $content -replace '<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>', '<Spinner size={32} className="text-blue-600 mx-auto" />'
    
    # Pattern 2: animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto
    $content = $content -replace '<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>', '<Spinner size={32} className="text-indigo-600 mx-auto" />'
    
    # Pattern 3: animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 (without mx-auto)
    $content = $content -replace '<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>', '<Spinner size={32} className="text-indigo-600 mx-auto" />'
    
    # Pattern 4: inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 (without closing tag on same line)
    $content = $content -replace '<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600">\s*</div>', '<Spinner size={32} className="text-blue-600 mx-auto" />'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName $content -NoNewline
        $replacementCount++
        Write-Output "Updated: $($file.FullName.Replace('e:\Projects\insightly\insightly\frontend\', ''))"
    }
}

Write-Output "`nTotal files updated: $replacementCount"
