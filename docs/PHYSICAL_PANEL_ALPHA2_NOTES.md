# MineBox Physical Panel Alpha 2

## Scope

Only physical MineBox for now.

Out of scope for now:

- login system,
- cloud hosting,
- billing,
- multi-user hosting.

## Goal

Replace current panel with a cleaner local LAN panel focused on one physical server.

## Must work

- big visible server status,
- START / STOP / RESTART using `screen minebox`,
- console command sender,
- latest.log viewer,
- indicators:
  - Minecraft process,
  - screen status,
  - panel service,
  - Minecraft service,
  - CPU,
  - RAM,
  - disk,
  - uptime,
  - tunnel/public port,
- simple mode by default,
- advanced mode for technical details.

## Commands

START:

```bash
/home/vboxuser/minebox/scripts/start_minecraft_screen.sh
```

STOP:

```bash
screen -S minebox -p 0 -X stuff 'stop\n'
```

CONSOLE COMMAND:

```bash
screen -S minebox -p 0 -X stuff '<command>\n'
```

## User workflow

User has already opened `nano app.py`, emptied the file, and is ready to paste the full new `app.py`.
