$ErrorActionPreference = "Stop"

$keystoreName = "tin-release.jks"
$alias = "tin-key"
$androidGenPath = Join-Path $PSScriptRoot "..\gen\android\app"
$keystorePath = Join-Path $androidGenPath $keystoreName
$propsPath = Join-Path $androidGenPath "key.properties"

# Check if keytool exists
if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) {
    Write-Error "keytool not found! Please ensure Java/Android Studio is installed and keytool is in your PATH."
    exit 1
}

# Ask for password or generate one
Write-Host "Set a password for your Android Release Key."
$password = Read-Host -AsSecureString -Prompt "Enter Password (leave empty to generate a random secure one)"
$plainPassword = ""

if ([System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)) -eq "") {
    # Generate random password
    $plainPassword = -join ((33..126) | Get-Random -Count 20 | % {[char]$_})
    Write-Host "Generated password: $plainPassword" -ForegroundColor Yellow
    Write-Host "SAVE THIS PASSWORD SECURELY!" -ForegroundColor Yellow
} else {
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
}

# Generate Keystore
Write-Host "Generating Keystore at $keystorePath..."
& keytool -genkey -v -keystore $keystorePath -alias $alias -keyalg RSA -keysize 2048 -validity 10000 -storepass $plainPassword -keypass $plainPassword -dname "CN=Tin App, OU=Engineering, O=Tin, L=Unknown, ST=Unknown, C=US"

if (-not (Test-Path $keystorePath)) {
    Write-Error "Failed to create keystore!"
    exit 1
}

# Create key.properties
Write-Host "Creating key.properties..."
$content = @"
storePassword=$plainPassword
keyPassword=$plainPassword
keyAlias=$alias
storeFile=$keystoreName
"@

Set-Content -Path $propsPath -Value $content

Write-Host "✅ Signing configuration complete!" -ForegroundColor Green
Write-Host "Key file: $keystorePath"
Write-Host "Properties file: $propsPath"
Write-Host "Note: These files are already added to .gitignore."
