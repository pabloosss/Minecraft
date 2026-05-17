# MineBox Alpha — plan wdrożenia

## Cel

MineBox ma działać jak fizyczne urządzenie hostingowe:

1. użytkownik włącza VM / urządzenie,
2. panel startuje sam,
3. Minecraft startuje sam,
4. tunel do VPS startuje sam,
5. publiczna domena działa automatycznie.

## Aktualny stan

- Panel lokalny działa: `http://192.168.1.42:5000`
- Minecraft działa przez `screen` o nazwie `minebox`
- Komendy do Minecrafta działają przez:

```bash
screen -S minebox -p 0 -X stuff 'say MineBox panel działa!\n'
```

- Publiczny Minecraft działa przez VPS.
- Wildcard DNS dla `*.mine-box.pl` został dodany.

## Standard uruchamiania Minecrafta

Używamy `screen`, żeby panel mógł wysyłać komendy do konsoli.

```bash
cd /home/vboxuser/minebox/server
screen -dmS minebox /home/vboxuser/java21/bin/java -Xms512M -Xmx3G -jar server.jar nogui
```

## Docelowe funkcje app.py Alpha

- UI 2.0 z zakładkami
- poprawne START / STOP / RESTART
- status `screen minebox`
- status procesu Java
- endpoint `/api/console/send`
- wysyłanie komend z panelu
- logi z `server/logs/latest.log`
- autostart Minecraft po starcie panelu
- konfiguracja domeny gracza
- sprawdzanie DNS wildcard
- backup świata

## Docelowe skrypty

```text
scripts/start_minecraft_screen.sh
scripts/start_panel.sh
scripts/start_tunnel.sh
scripts/status_all.sh
```

## Docelowy autostart

Systemd user services:

```text
minebox-panel.service
minebox-minecraft.service
minebox-tunnel.service
```

## Uwaga bezpieczeństwa

Nie wrzucać do repo:

- prywatnych kluczy SSH,
- haseł,
- tokenów,
- plików `.env`,
- plików z `.ssh`.
