# MineBox — systemd setup

## Cel

Po restarcie VM wszystko ma startować automatycznie:

- panel Flask,
- Minecraft w screen,
- tunel VPS.

## Minecraft service

Plik:

```text
~/.config/systemd/user/minebox-minecraft.service
```

Treść:

```ini
[Unit]
Description=MineBox Minecraft Server
After=network.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/home/vboxuser/minebox/scripts/start_minecraft_screen.sh
ExecStop=/usr/bin/screen -S minebox -p 0 -X stuff 'stop\n'

[Install]
WantedBy=default.target
```

## Reload systemd

```bash
systemctl --user daemon-reload
```

## Enable autostart

```bash
systemctl --user enable minebox-minecraft.service
```

## Start service manually

```bash
systemctl --user start minebox-minecraft.service
```

## Check status

```bash
systemctl --user status minebox-minecraft.service
```
