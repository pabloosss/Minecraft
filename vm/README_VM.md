# VM / MineBox

## Aktualna VM

Ubuntu w VirtualBox.

Użytkownik:

```text
vboxuser
```

## Panel WWW

Uruchamianie:

```bash
cd ~/minebox
source venv/bin/activate
pkill -f 'python3 app.py' || true
python3 app.py
```

Panel:

```text
http://192.168.1.42:5000
```

## Tunnel do VPS

```bash
ssh -i ~/.ssh/minebox_vps -N -R 0.0.0.0:25565:127.0.0.1:25565 root@31.70.86.109
```

## Test publicznego portu

```bash
python3 public_status.py
```

## Ważne pliki

```text
~/minebox/app.py
~/minebox/public_status.py
~/.ssh/minebox_vps
```
