#!/usr/bin/env pwsh
# =======================================================
# Sfera Gamification Backend Deploy Script
# Server: 89.116.30.180  |  User: root
# =======================================================

param (
    [string]$Server = $env:DEPLOY_SERVER,
    [string]$User = $env:DEPLOY_USER,
    [string]$ServiceName = "sfera-gamification",
    [string]$DeployDir = "/opt/sfera"
)

# Set defaults if not provided via parameter or environment variables
if ([string]::IsNullOrEmpty($Server)) { $Server = "89.116.30.180" }
if ([string]::IsNullOrEmpty($User)) { $User = "root" }

$JAR_LOCAL = "target\sfera-gamification-backend-0.0.1-SNAPSHOT.jar"
$JAR_REMOTE = "$DeployDir/app.jar"
$SERVICE_NAME = $ServiceName
$DEPLOY_DIR = $DeployDir

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  SFERA Backend Deploy to $SERVER" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if JAR exists
if (-not (Test-Path $JAR_LOCAL)) {
    Write-Host "[ERROR] JAR topilmadi: $JAR_LOCAL" -ForegroundColor Red
    Write-Host "Avval: mvn clean package -DskipTests" -ForegroundColor Yellow
    exit 1
}

$JAR_SIZE = [math]::Round((Get-Item $JAR_LOCAL).Length / 1MB, 1)
Write-Host "[OK] JAR tayyor: $JAR_LOCAL ($JAR_SIZE MB)" -ForegroundColor Green
Write-Host ""

# Step 1: Create deploy directory on server
Write-Host "1. Serverda papka yaratilmoqda..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" "mkdir -p $DEPLOY_DIR"
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] SSH ulanib bolmadi" -ForegroundColor Red; exit 1 }
Write-Host "   [OK] $DEPLOY_DIR mavjud" -ForegroundColor Green

# Step 2: Upload JAR
Write-Host ""
Write-Host "2. JAR yuborilmoqda (bu biroz vaqt olishi mumkin)..." -ForegroundColor Yellow
scp "${JAR_LOCAL}" "${USER}@${SERVER}:${JAR_REMOTE}"
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] JAR yuborishda xatolik" -ForegroundColor Red; exit 1 }
Write-Host "   [OK] JAR yuklandi: $JAR_REMOTE" -ForegroundColor Green

# Step 3: Create/update systemd service
Write-Host ""
Write-Host "3. Systemd xizmat fayli yaratilmoqda..." -ForegroundColor Yellow

$SERVICE_CONTENT = @"
[Unit]
Description=Sfera Gamification Backend
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/bin/java -Xmx256m -Xms128m -jar $JAR_REMOTE
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sfera-gamification
Environment=SPRING_PROFILES_ACTIVE=prod

[Install]
WantedBy=multi-user.target
"@

# Write service file remotely
$SERVICE_CONTENT | ssh "${USER}@${SERVER}" "cat > /etc/systemd/system/${SERVICE_NAME}.service"
Write-Host "   [OK] Xizmat fayli /etc/systemd/system/${SERVICE_NAME}.service" -ForegroundColor Green

# Step 4: Reload & restart service
Write-Host ""
Write-Host "4. Xizmat qayta ishga tushirilmoqda..." -ForegroundColor Yellow
ssh "${USER}@${SERVER}" @"
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME
sleep 3
systemctl status $SERVICE_NAME --no-pager -l
"@

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "  Deploy TUGADI!" -ForegroundColor Green
Write-Host "  Backend: http://${SERVER}:8080" -ForegroundColor Cyan
Write-Host "  Log kurish: journalctl -u $SERVICE_NAME -f" -ForegroundColor Gray
Write-Host "=================================================" -ForegroundColor Green
