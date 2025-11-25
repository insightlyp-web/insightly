# PowerShell script to replace default spinners with Spinner component
$files = @(
    "app\faculty\layout.tsx",
    "app\hod\layout.tsx",
    "app\admin\layout.tsx",
    "app\student\dashboard\page.tsx",
    "app\faculty\dashboard\page.tsx",
    "app\hod\dashboard\page.tsx",
    "app\admin\dashboard\page.tsx"
)

foreach ($file in $files) {
    $path = "e:\Projects\insightly\insightly\frontend\$file"
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        
        # Add import if not present
        if ($content -notmatch 'import.*Spinner.*from.*@/components/ui/spinner') {
            $content = $content -replace '(import.*from.*@/lib/axios.*;)', "`$1`nimport { Spinner } from `"@/components/ui/spinner`";"
        }
        
        # Replace spinner divs
        $content = $content -replace '<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>', '<Spinner size={32} className="text-blue-600" />'
        $content = $content -replace '<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>', '<Spinner size={32} className="text-indigo-600 mx-auto" />'
        
        Set-Content $path $content -NoNewline
        Write-Output "Updated: $file"
    }
}
