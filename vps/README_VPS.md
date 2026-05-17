# VPS / home.pl

## VPS IP

```text
31.70.86.109
```

## SSH

Logowanie z Windows:

```powershell
ssh -i $env:USERPROFILE\.ssh\minebox_vps root@31.70.86.109
```

## Firewall

Otwarte porty:

```text
22/tcp
25565/tcp
```

## SSH Config

Plik:

```text
/etc/ssh/sshd_config.d/99-minebox.conf
```

Zawartość:

```text
GatewayPorts yes
AllowTcpForwarding yes
```

## Restart SSH

```bash
mkdir -p /run/sshd
sshd -t
systemctl restart ssh
```

## Sprawdzenie tunelu

```bash
ss -ltnp | grep 25565
```

## Publiczny Minecraft

```text
31.70.86.109:25565
```
