import type { KB, Notebook, Page, Section } from "@/lib/kb";

// Code fences use ~~~ so they can live inside template literals.
let n = 0;
const id = (p: string) => `${p}-${(n++).toString(36)}`;
const pg = (title: string, content: string): Page => ({ id: id("p"), title, content: content.trim(), updated: 0 });
const sec = (name: string, pages: Page[]): Section => ({ id: id("s"), name, pages });
const nb = (name: string, icon: string, sections: Section[]): Notebook => ({ id: id("n"), name, icon, sections });

export function seedKB(): KB {
  n = 0;
  return {
    version: 1,
    notebooks: [
      nb("Windows Desktop", "monitor", [
        sec("How-To", [
          pg("Map a network drive", `
# Map a network drive

**GUI:** File Explorer → This PC → *Map network drive* → choose a letter → enter \\\\server\\share → tick *Reconnect at sign-in*.

**Command line:**
~~~cmd
net use Z: \\\\fileserver\\shared /persistent:yes
net use            :: list mapped drives
net use Z: /delete :: remove
~~~

**PowerShell:**
~~~powershell
New-PSDrive -Name Z -PSProvider FileSystem -Root "\\\\fileserver\\shared" -Persist
~~~
> Tip: if it fails with *System error 53*, the server name can't be resolved — test with ping / nslookup.
`),
          pg("Add a printer by IP", `
# Add a printer by IP

1. Settings → Bluetooth & devices → Printers & scanners → **Add device**.
2. Click *Add manually* → **Add a printer using an IP address or hostname**.
3. Enter the IP, let Windows detect the driver (or choose *Have Disk*).

~~~powershell
Add-PrinterPort -Name "IP_10.0.0.50" -PrinterHostAddress "10.0.0.50"
Add-Printer -Name "Office-MFP" -DriverName "Microsoft IPP Class Driver" -PortName "IP_10.0.0.50"
~~~
`),
          pg("Create a local admin account", `
# Create a local admin account

~~~powershell
$pw = Read-Host -AsSecureString "Password"
New-LocalUser -Name "itadmin" -Password $pw -FullName "IT Admin"
Add-LocalGroupMember -Group "Administrators" -Member "itadmin"
~~~
CMD alternative:
~~~cmd
net user itadmin * /add
net localgroup Administrators itadmin /add
~~~
`),
        ]),
        sec("Troubleshooting", [
          pg("Slow PC checklist", `
# Slow PC checklist

1. **Task Manager** (Ctrl+Shift+Esc) → sort by CPU, Memory, Disk.
2. Startup apps tab → disable unneeded items.
3. Check free disk space (keep >15%).
4. Run system file repair:
~~~cmd
sfc /scannow
DISM /Online /Cleanup-Image /RestoreHealth
~~~
5. Check for pending Windows Updates and reboot.
6. Run *Disk Cleanup* (cleanmgr) → Clean up system files.
7. Check Event Viewer → Windows Logs → System for disk/driver errors.
`),
          pg("No internet / network reset", `
# No internet

~~~cmd
ipconfig /all          :: do we have an IP? 169.254.x.x = no DHCP
ping 8.8.8.8           :: raw connectivity
ping google.com        :: DNS working?
ipconfig /release && ipconfig /renew
ipconfig /flushdns
netsh winsock reset
netsh int ip reset
~~~
Reboot after winsock/ip reset. Last resort: Settings → Network → Advanced → **Network reset**.
`),
          pg("Blue screen (BSOD)", `
# Blue screen

- Note the **stop code** (e.g. IRQL_NOT_LESS_OR_EQUAL).
- Dumps live in C:\\Windows\\Minidump — open with **WinDbg** (!analyze -v).
- Recent driver/update? Roll back via Device Manager or uninstall update.
- Test RAM: *mdsched.exe*. Test disk: chkdsk C: /f /r
- Boot to Safe Mode: hold Shift while clicking Restart → Troubleshoot → Startup Settings.
`),
        ]),
      ]),
      nb("macOS", "apple", [
        sec("How-To", [
          pg("Useful shortcuts & basics", `
# macOS basics

| Action | Shortcut |
|---|---|
| Spotlight search | Cmd + Space |
| Force quit | Cmd + Option + Esc |
| Screenshot area | Cmd + Shift + 4 |
| Lock screen | Ctrl + Cmd + Q |
| Show hidden files (Finder) | Cmd + Shift + . |

Terminal is in Applications → Utilities.
`),
          pg("Terminal commands", `
# macOS Terminal

~~~bash
sw_vers                         # macOS version
system_profiler SPHardwareDataType
softwareupdate -l               # list updates
sudo softwareupdate -ia         # install all
networksetup -listallhardwareports
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder   # flush DNS
diskutil list
profiles status -type enrollment   # MDM enrolment status
~~~
`),
        ]),
        sec("Troubleshooting", [
          pg("Mac won't boot / reset", `
# Recovery options (Apple silicon)

- **Recovery:** hold power button until *Loading startup options* → Options.
- **Safe mode:** at startup options, hold Shift and click Continue.
- **Disk Utility → First Aid** on the startup disk.
- Intel Macs: Cmd+R (recovery), reset NVRAM with Option+Cmd+P+R.
`),
        ]),
      ]),
      nb("Mobile Phones", "smartphone", [
        sec("iPhone / iOS", [
          pg("Common iPhone fixes", `
# iPhone fixes

- **Force restart:** Volume Up, Volume Down, then hold Side button.
- **Reset network settings:** Settings → General → Transfer or Reset → Reset → Reset Network Settings.
- **Mail not syncing:** remove & re-add account; check Settings → Mail → Accounts → Fetch New Data.
- **Check MDM profile:** Settings → General → VPN & Device Management.
`),
        ]),
        sec("Android", [
          pg("Common Android fixes", `
# Android fixes

- Safe mode: hold power → long-press *Power off* → Safe mode.
- Clear app cache: Settings → Apps → [app] → Storage → Clear cache.
- Reset network: Settings → System → Reset options → Reset Wi-Fi, mobile & Bluetooth.
- Work profile (Intune): apps with a briefcase icon are managed.
`),
        ]),
      ]),
      nb("Active Directory", "network", [
        sec("Users & Groups", [
          pg("Unlock / reset user", `
# Unlock & reset a user

~~~powershell
Import-Module ActiveDirectory
Search-ADAccount -LockedOut | Select Name, SamAccountName
Unlock-ADAccount -Identity jsmith
Set-ADAccountPassword -Identity jsmith -Reset -NewPassword (Read-Host -AsSecureString "New pw")
Set-ADUser -Identity jsmith -ChangePasswordAtLogon $true
~~~
GUI: **Active Directory Users and Computers** (dsa.msc) → right-click user → Reset Password.
`),
          pg("Create user & add to group", `
# Create user

~~~powershell
New-ADUser -Name "Jane Doe" -GivenName Jane -Surname Doe \`
  -SamAccountName jdoe -UserPrincipalName jdoe@contoso.com \`
  -Path "OU=Staff,DC=contoso,DC=com" \`
  -AccountPassword (Read-Host -AsSecureString "Password") -Enabled $true
Add-ADGroupMember -Identity "Sales" -Members jdoe
Get-ADPrincipalGroupMembership jdoe | Select Name
~~~
`),
          pg("Useful AD queries", `
# AD queries

~~~powershell
Get-ADUser jdoe -Properties *                     # everything about a user
Get-ADUser -Filter {Enabled -eq $false}           # disabled users
Search-ADAccount -AccountInactive -TimeSpan 90.00:00:00 -UsersOnly
Get-ADGroupMember "Domain Admins"
Get-ADComputer -Filter * | Measure-Object
~~~
CMD: whoami /groups, gpresult /r, nltest /dsgetdc:contoso.com
`),
        ]),
        sec("Group Policy", [
          pg("Group Policy basics", `
# Group Policy

- Manage with **gpmc.msc**. Link GPOs to OUs.
- Force update on a client: gpupdate /force
- See what applied: gpresult /r or gpresult /h report.html
- Order of processing: Local → Site → Domain → OU (LSDOU). Last one wins.
`),
        ]),
      ]),
      nb("Microsoft Intune", "shield", [
        sec("Devices", [
          pg("Enroll & sync a device", `
# Enrol & sync

- **Windows:** Settings → Accounts → Access work or school → Connect (or Entra join at OOBE / Autopilot).
- **iOS/Android:** install *Company Portal*, sign in.
- **Force sync (Windows):** Settings → Accounts → Access work or school → Info → **Sync**.
- **Admin:** intune.microsoft.com → Devices → [device] → Sync.

~~~powershell
# Check Entra/Intune join state
dsregcmd /status
~~~
Look for AzureAdJoined : YES and MDMUrl populated.
`),
          pg("Deploy an app (Win32)", `
# Deploy a Win32 app

1. Package with **IntuneWinAppUtil.exe** → .intunewin file.
2. Intune → Apps → Windows → Add → *Windows app (Win32)*.
3. Install command e.g. setup.exe /S, uninstall command, detection rule (file/registry/MSI code).
4. Assign to a group as *Required* or *Available*.
5. Logs on client: C:\\ProgramData\\Microsoft\\IntuneManagementExtension\\Logs
`),
          pg("Compliance & troubleshooting", `
# Compliance troubleshooting

- Device shows *Not compliant* → open device → Device compliance → see failing setting.
- Common: BitLocker off, OS too old, no password, Defender out of date.
- Client event logs: Event Viewer → Applications and Services → Microsoft → Windows → DeviceManagement-Enterprise-Diagnostics-Provider.
- Collect diagnostics: Intune → device → **Collect diagnostics**.
`),
        ]),
      ]),
      nb("Microsoft 365", "mail", [
        sec("Outlook", [
          pg("Outlook troubleshooting", `
# Outlook

- Start in safe mode: outlook.exe /safe
- Reset nav pane: outlook.exe /resetnavpane
- New profile: Control Panel → Mail (Microsoft Outlook) → Show Profiles → Add.
- Repair OST: close Outlook, rename/delete the .ost in %localappdata%\\Microsoft\\Outlook — it rebuilds.
- Quick Repair Office: Settings → Apps → Microsoft 365 → Modify → Quick Repair.
`),
        ]),
        sec("Teams & OneDrive", [
          pg("Clear Teams cache", `
# Clear new Teams cache

Quit Teams, then:
~~~powershell
Remove-Item "$env:LOCALAPPDATA\\Packages\\MSTeams_8wekyb3d8bbwe\\LocalCache\\Microsoft\\MSTeams\\*" -Recurse -Force
~~~
Restart Teams.
`),
          pg("Reset OneDrive", `
# Reset OneDrive

~~~cmd
%localappdata%\\Microsoft\\OneDrive\\onedrive.exe /reset
~~~
If it does not restart within a few minutes, launch OneDrive from the Start menu.
`),
        ]),
        sec("Exchange Online", [
          pg("Exchange Online PowerShell", `
# Exchange Online

~~~powershell
Install-Module ExchangeOnlineManagement
Connect-ExchangeOnline -UserPrincipalName admin@contoso.com
Get-Mailbox jdoe | fl
Add-MailboxPermission -Identity shared@contoso.com -User jdoe -AccessRights FullAccess
Set-Mailbox jdoe -ForwardingSmtpAddress boss@contoso.com
Get-MessageTrace -SenderAddress jdoe@contoso.com -StartDate (Get-Date).AddDays(-2) -EndDate (Get-Date)
~~~
`),
        ]),
      ]),
      nb("Alternative Apps", "package", [
        sec("7-Zip", [
          pg("Using 7-Zip", `
# 7-Zip

**Right-click** a file → 7-Zip → *Add to archive* / *Extract Here* / *Extract to "folder\\"*.

Password-protect: Add to archive → Encryption → set password, use **AES-256**, tick *Encrypt file names* (7z format).

~~~cmd
7z a backup.7z C:\\Data\\*          :: create
7z x backup.7z -oC:\\Restore        :: extract with folders
7z l backup.7z                     :: list contents
7z a -p -mhe=on secret.7z file.txt :: password + hide names
7z t backup.7z                     :: test integrity
~~~
**Troubleshoot:** *CRC failed* = corrupt/incomplete download. *Cannot open as archive* = wrong format or split archive (open the .001 file).
`),
        ]),
        sec("LibreOffice", [
          pg("Using LibreOffice", `
# LibreOffice

Apps: **Writer** (Word), **Calc** (Excel), **Impress** (PowerPoint), Draw, Base.

- Save as Microsoft format by default: Tools → Options → Load/Save → General → *Always save as* → Word/Excel.
- Export PDF: File → Export As → Export as PDF.
- Convert from command line:
~~~cmd
soffice --headless --convert-to pdf report.docx
soffice --headless --convert-to xlsx data.ods
~~~
**Troubleshoot:**
- Crashes on start → reset profile: Help → Restart in Safe Mode → Reset to factory settings.
- Fonts look wrong in .docx → install Carlito/Caladea (Calibri/Cambria metric-compatible).
- Slow → Tools → Options → Advanced → disable Java if unused.
`),
        ]),
        sec("PDF-XChange", [
          pg("Using PDF-XChange Editor", `
# PDF-XChange Editor

- **Edit text:** Edit tab → Edit Content → Text.
- **Fill & sign:** Protect tab → Add Signature / Sign Document.
- **Combine PDFs:** File → New Document → *Combine Files into a Single PDF*.
- **OCR:** Convert tab → OCR Pages (makes scans searchable).
- **Redact:** Protect → Mark for Redaction → Apply All Redactions.

**Troubleshoot:**
- Watermark on output → you used a PRO feature in the free version (features are marked with a badge).
- Not default PDF app → Windows Settings → Default apps → .pdf.
- Printing issues → File → Print → Advanced → *Print as image*.
- Reset settings: Edit → Preferences → *Reset all*.
`),
        ]),
      ]),
      nb("Command Library", "terminal", [
        sec("CMD", [
          pg("Essential CMD commands", `
# CMD essentials

~~~cmd
ipconfig /all                  :: network config
ping -t host                   :: continuous ping
tracert host                   :: route path
nslookup host                  :: DNS lookup
netstat -ano                   :: open ports + PIDs
tasklist | findstr chrome      :: find process
taskkill /PID 1234 /F          :: kill process
systeminfo                     :: OS/hardware summary
wmic bios get serialnumber     :: serial number
shutdown /r /t 0               :: restart now
robocopy C:\\src D:\\dst /MIR /R:1 /W:1   :: mirror folders
chkdsk C: /f                   :: check disk
~~~
`),
        ]),
        sec("PowerShell", [
          pg("PowerShell essentials", `
# PowerShell essentials

~~~powershell
Get-Help Get-Process -Examples        # learn any command
Get-Command *service*                 # find commands
Get-Service | Where Status -eq Running
Restart-Service Spooler               # fix stuck print queue
Get-Process | Sort CPU -Desc | Select -First 10
Test-NetConnection server -Port 443   # port test
Get-CimInstance Win32_OperatingSystem | Select Caption, LastBootUpTime
Get-ChildItem C:\\ -Recurse -File | Sort Length -Desc | Select -First 20 FullName, Length
Get-WinEvent -LogName System -MaxEvents 50
Get-ComputerInfo
~~~
`),
          pg("Script: clean temp files (explained)", `
# Script: clean temp files

**Goal:** free disk space by deleting temp files older than 7 days.

~~~powershell
# 1. Define folders to clean
$paths = @("$env:TEMP", "C:\\Windows\\Temp")

# 2. Files older than this date will be removed
$cutoff = (Get-Date).AddDays(-7)

foreach ($p in $paths) {
    # 3. Find files recursively, ignore access errors
    Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -lt $cutoff } |
        # 4. Delete; -WhatIf first to preview!
        Remove-Item -Force -ErrorAction SilentlyContinue
}
Write-Host "Cleanup complete"
~~~
**How it works:** gets each file, filters by age, pipes to Remove-Item. Add -WhatIf to Remove-Item to test safely first. Run as admin for C:\\Windows\\Temp.
`),
          pg("Script: bulk-create AD users from CSV", `
# Script: bulk-create AD users

CSV (users.csv): First,Last,Sam,Dept

~~~powershell
Import-Module ActiveDirectory
$pw = Read-Host -AsSecureString "Initial password"

Import-Csv .\\users.csv | ForEach-Object {
    # Build each user from the CSV row
    New-ADUser -Name "$($_.First) $($_.Last)" \`
        -GivenName $_.First -Surname $_.Last \`
        -SamAccountName $_.Sam \`
        -UserPrincipalName "$($_.Sam)@contoso.com" \`
        -Department $_.Dept \`
        -AccountPassword $pw -Enabled $true -ChangePasswordAtLogon $true
    Write-Host "Created $($_.Sam)"
}
~~~
**Explained:** Import-Csv turns each line into an object; $_ is the current row; backticks continue a line.
`),
          pg("Script: inventory report to CSV", `
# Script: PC inventory

~~~powershell
$os  = Get-CimInstance Win32_OperatingSystem
$cs  = Get-CimInstance Win32_ComputerSystem
$bios= Get-CimInstance Win32_BIOS
[PSCustomObject]@{
  Computer = $env:COMPUTERNAME
  User     = $cs.UserName
  Model    = $cs.Model
  Serial   = $bios.SerialNumber
  OS       = $os.Caption
  RAMGB    = [math]::Round($cs.TotalPhysicalMemory/1GB,1)
  LastBoot = $os.LastBootUpTime
} | Export-Csv "$env:USERPROFILE\\Desktop\\inventory.csv" -NoTypeInformation
~~~
**Explained:** CIM queries hardware info; PSCustomObject builds one tidy row; Export-Csv writes it for Excel.
`),
        ]),
        sec("Bash / zsh", [
          pg("Bash essentials", `
# Bash / zsh essentials

~~~bash
ls -la          # list incl. hidden
cd ~/Downloads
cp -r src dst   # copy folder
grep -ri "error" /var/log
top             # live processes
ps aux | grep app
kill -9 1234
df -h           # disk space
du -sh *        # folder sizes
curl -I https://example.com
chmod +x script.sh
~~~
`),
        ]),
      ]),
      nb("Protocols & Ports", "book", [
        sec("Reference", [
          pg("Common ports", `
# Common ports

| Port | Protocol | Use |
|---|---|---|
| 20/21 | FTP | File transfer |
| 22 | SSH/SFTP | Secure shell |
| 23 | Telnet | Insecure remote |
| 25 | SMTP | Mail sending |
| 53 | DNS | Name resolution |
| 67/68 | DHCP | IP assignment |
| 80 | HTTP | Web |
| 88 | Kerberos | AD auth |
| 110 | POP3 | Mail retrieval |
| 123 | NTP | Time sync |
| 143 | IMAP | Mail |
| 389 / 636 | LDAP / LDAPS | Directory |
| 443 | HTTPS | Secure web |
| 445 | SMB | File sharing |
| 587 | SMTP submission | Mail (TLS) |
| 3389 | RDP | Remote desktop |
`),
          pg("Protocol basics", `
# Protocol basics

- **TCP** — reliable, connection based (web, mail, SMB).
- **UDP** — fast, no guarantee (DNS, DHCP, VoIP, streaming).
- **DNS** — name → IP. Records: A, AAAA, CNAME, MX, TXT, SRV.
- **DHCP** — DORA: Discover, Offer, Request, Acknowledge.
- **Kerberos** — AD login tickets; needs clocks within 5 minutes.
- **Private IP ranges:** 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. 169.254.x.x = APIPA (no DHCP).
`),
        ]),
      ]),
      nb("Field Kit", "wrench", [
        sec("Helping at home", [
          pg("First-visit checklist", `
# First visit at someone's home

**Before touching anything:**
- Ask them to show you the problem themselves — watch what they actually do.
- Write down (here!) passwords they give you, or better: set up a password manager with them.
- Check backups exist *before* changing settings.

**Quick health pass:**
1. Updates pending? (Windows Update / System Settings → Software Update)
2. Disk nearly full? Keep 15%+ free.
3. Browser: how many toolbars/extensions? Remove junk.
4. Startup apps: disable everything they don't recognise.
5. Antivirus: is one actually installed and current?

**Leave behind:** a note with what you did + your phone number. Elderly users relax when they can read what changed.
`),
          pg("Common elderly-user fixes", `
# Fixes that solve 80% of home visits

- **"Internet is gone"** → router unplugged or Wi-Fi toggled off (Fn key / airplane mode). Check the physical basics first.
- **"Everything is huge/tiny"** → display scaling changed. Settings → Display → Scale 100%/125%. Browser zoom: Ctrl+0 resets.
- **"My files vanished"** → usually OneDrive backup moved Desktop/Documents into OneDrive. Check the OneDrive folder.
- **"Email stopped"** → password expired or changed on phone but not PC. Re-enter in the mail app.
- **"Computer is slow"** → 30 browser tabs + never rebooted. Show them how to restart (not just close the lid).
- **Scam check:** look for remote-access tools (AnyDesk, TeamViewer, QuickAssist) they didn't install — remove them and talk about phone scams.
- **Printer:** is it on the same Wi-Fi as the PC? Reboot printer + router before reinstalling drivers.
`),
          pg("Set up a new PC for someone", `
# New PC handover

1. Run through Windows setup; create *their* Microsoft account (write the password down together).
2. Install updates fully before anything else.
3. Install: browser of choice, PDF reader, 7-Zip, LibreOffice (free Office alternative).
4. Move files from the old machine (USB disk or network share).
5. Set up mail, printer, and their 3 favourite websites as bookmarks.
6. Turn on OneDrive or another backup — explain it in one sentence.
7. Create a second local admin account for yourself (see Windows Desktop notebook) so you can fix things later.
8. Show them: restart, volume, Wi-Fi icon. That's it — don't overload.
`),
        ]),
        sec("Small office network", [
          pg("Plan a small network", `
# Small office network plan

**Typical layout:**
~~~text
Internet → ISP modem/router → firewall/router → switch → PCs, printers, APs
~~~

**Checklist:**
1. Count devices: PCs + printers + phones + Wi-Fi clients + spare ports.
2. Switch: at least that many ports, gigabit, plus 20% headroom.
3. Wi-Fi: one access point per ~15 users or per floor/room cluster.
4. IP plan: router at 192.168.1.1, DHCP range .100–.199, reserve .10–.49 for printers/servers (static or DHCP reservation).
5. Label every cable both ends. Future-you says thanks.
6. Document: ISP login, router admin password, Wi-Fi password — store in this KB.

**Rule of thumb:** if the ISP router is doing Wi-Fi + routing + DHCP for a business, replace its Wi-Fi with a real access point.
`),
          pg("Router & Wi-Fi setup", `
# Router & Wi-Fi setup

1. Connect to router admin page (usually 192.168.0.1 or 192.168.1.1).
2. **Change the admin password** first. Always.
3. Update firmware.
4. Set WAN: DHCP from ISP, or PPPoE/static if the ISP gave details.
5. LAN: enable DHCP, set the range, add reservations for printers/NAS.
6. Wi-Fi: WPA2-AES or WPA3, one SSID, strong passphrase. Disable WPS.
7. Guest Wi-Fi: separate SSID, client isolation on.
8. Disable remote admin from the internet unless needed.

**Test after:** wired PC gets internet, Wi-Fi client gets internet, printer reachable from all PCs, speed test near the AP and at the far desk.
`),
          pg("Diagnose office network issues", `
# "The network is down" — where to look

**One device affected:**
~~~cmd
ipconfig /all        :: has an IP? 169.254.x.x = no DHCP
ping 192.168.1.1     :: can it reach the router?
ping 8.8.8.8         :: router reaches internet?
ping google.com      :: DNS working?
~~~
- No IP → cable/switch port/DHCP. Try another port.
- IP but no router ping → cable, VLAN, or NIC.
- Router pings, no internet → ISP or WAN config. Check modem lights.
- Internet by IP but not by name → DNS. Set 1.1.1.1 / 8.8.8.8 to test.

**Everyone affected:** modem/router/switch power and lights → reboot in order: modem, wait 2 min, router, switch. Still down → call the ISP with your findings written down.
`),
          pg("NAS / file sharing basics", `
# Simple file sharing for a small office

**Easiest options:**
- A NAS (Synology/QNAP) with one shared folder per team.
- Or share a folder from one always-on Windows PC.

**Windows share:**
~~~powershell
New-SmbShare -Name "Office" -Path "D:\\Office" -FullAccess "Everyone"
# then tighten NTFS permissions on the folder itself
~~~

**Map it on each PC:**
~~~cmd
net use O: \\\\NAS\\Office /persistent:yes
~~~

**Must-dos:**
- Turn on the NAS recycle bin / snapshots — that is your "undelete".
- Set up backup of the share to USB disk or cloud. RAID is not backup.
- Give each person their own login; avoid one shared account.
`),
        ]),
        sec("Email setup", [
          pg("Choose an email setup", `
# Email for a small company

**Realistic options:**
| Option | Cost | When |
|---|---|---|
| Microsoft 365 Business Basic | ~$6/user/mo | Want Exchange, Teams, 1TB OneDrive |
| Google Workspace Starter | ~$6/user/mo | Prefer Gmail/Drive |
| Zoho Mail | free–$1/user/mo | Tiny budget, just mail |
| ISP/free mailbox | free | One person, non-critical only |

**Recommendation:** for a business, pay for Microsoft 365 or Google Workspace. You get proper spam filtering, backups, and support. Running your own mail server at a small office is almost never worth it — deliverability and security upkeep eat your time.

**You need:** a domain name (e.g. company.com) before anything else.
`),
          pg("DNS records for email", `
# DNS records that make email work

Set these at the domain's DNS host (registrar or Cloudflare):

| Type | Name | Value | Purpose |
|---|---|---|---|
| MX | @ | mail provider's server | where mail arrives |
| TXT | @ | v=spf1 include:... -all | who may send for you |
| TXT | selector._domainkey | DKIM key from provider | signed mail |
| TXT | _dmarc | v=DMARC1; p=quarantine | anti-spoofing policy |

**Microsoft 365** gives you exact values in the admin center → Settings → Domains.
**Google Workspace** → Admin console → Apps → Gmail → Authenticate email.

**Check your work:**
~~~cmd
nslookup -type=MX company.com
nslookup -type=TXT company.com
~~~
DNS changes can take minutes to 24h to propagate.
`),
          pg("Set up mail on devices", `
# Add mail to phones & PCs

**Modern accounts (M365/Google):** just sign in — Outlook, Apple Mail and Gmail apps autodiscover everything.

**Manual/IMAP settings (when asked):**
- IMAP (incoming): provider's server, port **993**, SSL/TLS
- SMTP (outgoing): provider's server, port **587**, STARTTLS
- Username = full email address

**Microsoft 365 manual:**
- IMAP: outlook.office365.com:993
- SMTP: smtp.office365.com:587

**POP3 vs IMAP:** choose IMAP — mail stays on the server and syncs to every device. POP3 downloads to one device only.

**Test after setup:** send a mail out, send one in from another account, reply to it. All three must work.
`),
          pg("Email problems cheat sheet", `
# "Email isn't working"

**Can't send:**
- Check SMTP settings + password (see device setup page).
- "Relay denied" → outgoing authentication not enabled.
- Sent but never arrives → check Junk on the other side; check SPF/DKIM records.

**Can't receive:**
- Mailbox full? (very common)
- MX record correct? nslookup -type=MX domain.com
- Check provider's webmail — if mail is there, the device settings are wrong, not the server.

**Password loops on one device only:** delete the account from that device and re-add it.

**"We got hacked / sent spam":** change the password immediately, enable MFA, check for forwarding rules the user didn't create (Outlook → Settings → Mail → Rules and Forwarding).
`),
        ]),
      ]),
      nb("Troubleshooting", "wrench", [
        sec("Method", [
          pg("Troubleshooting methodology", `
# Troubleshooting method

1. **Identify** the problem — ask: what changed? who is affected? error message?
2. **Theory** of probable cause — start simple (power, cable, reboot).
3. **Test** the theory.
4. **Plan** & implement the fix.
5. **Verify** full functionality.
6. **Document** it — here in the knowledge base!
`),
          pg("Ticket template", `
# Ticket notes template

- **User / device:**
- **Issue:**
- **Error message:**
- **Started when:**
- **Steps tried:**
- **Resolution:**
- **Time spent:**
`),
        ]),
      ]),
    ],
  };
}
