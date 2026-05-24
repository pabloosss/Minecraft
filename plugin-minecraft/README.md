# MineBox Ultimate Plugin

Plugin PaperMC dla fizycznego MineBoxa.

Na tym etapie MineBox to lokalny serwer Minecraft na urządzeniu/VM, lokalny panel Flask i ewentualny tunel/VPS jako brama. To nie jest jeszcze cloud hosting ani system billingowy.

## Architektura MineBox

```text
Minecraft lokalnie:
/home/vboxuser/minebox/server

Plugin po zbudowaniu:
/home/vboxuser/minebox/server/plugins/MineBoxUltimate.jar

Panel Flask:
http://192.168.1.42:5000

Panel app.py:
/home/vboxuser/minebox/app.py

Screen serwera:
minebox

Start serwera:
/home/vboxuser/minebox/scripts/start_minecraft_screen.sh
```

## Funkcje

- `/vip` dla gracza,
- `/minebox status` dla admina,
- `/minebox reload`,
- `/minebox vip give <gracz> <pakiet> [dni]`,
- `/minebox vip remove <gracz>`,
- `/minebox vip list`,
- czasowe VIP/SVIP,
- permanentny VIP dla `dni <= 0`,
- zapis danych w `plugins/MineBoxUltimate/vips.yml`,
- obsługa graczy offline,
- join-message dla VIP,
- automatyczne usuwanie wygasłych VIP-ów co 5 minut,
- opcjonalny panel sync HTTP POST,
- brak twardej zależności od LuckPerms.

## Technologia

- Java 17
- Gradle
- Paper API 1.20.4
- `api-version: '1.20'`

## Budowanie

W folderze `plugin-minecraft`:

```bash
gradle build
```

Jeśli dodasz Gradle Wrapper:

```bash
./gradlew build
```

Wynikowy plik:

```text
plugin-minecraft/build/libs/MineBoxUltimate.jar
```

## Instalacja na MineBox

Z katalogu repo po buildzie:

```bash
cp plugin-minecraft/build/libs/MineBoxUltimate.jar /home/vboxuser/minebox/server/plugins/MineBoxUltimate.jar
```

Potem restart serwera Minecraft.

Jeśli używasz screena:

```bash
screen -S minebox -p 0 -X stuff 'stop\n'
/home/vboxuser/minebox/scripts/start_minecraft_screen.sh
```

## Test ręczny

Po starcie serwera wpisz:

```text
/plugins
/minebox status
/minebox reload
/minebox vip give Pablo vip 30
/vip
/minebox vip list
/minebox vip remove Pablo
```

## Komendy

### Gracz

```text
/vip
```

Pokazuje:

- czy gracz ma VIP,
- typ pakietu: VIP/SVIP,
- pozostały czas,
- datę wygaśnięcia.

### Admin

```text
/minebox status
```

Pokazuje:

- nazwę serwera,
- ID serwera,
- wersję pluginu,
- stan VIP systemu,
- stan panel sync,
- graczy online,
- RAM,
- TPS, jeśli Paper udostępnia dane.

```text
/minebox reload
```

Przeładowuje `config.yml` i `vips.yml`.

```text
/minebox sync
```

Ręcznie wysyła status do panelu, jeśli `panel.enabled: true`.

```text
/minebox vip give <gracz> <pakiet> [dni]
```

Przykłady:

```text
/minebox vip give Pablo vip 30
/minebox vip give Pablo svip 60
/minebox vip give Pablo vip 0
```

`0` albo `-1` oznacza VIP permanentny.

```text
/minebox vip remove <gracz>
```

Usuwa VIP/SVIP z `vips.yml` i wykonuje komendy usuwające permission.

```text
/minebox vip list
```

Pokazuje aktywnych VIP-ów.

## vips.yml

Plugin zapisuje dane tak:

```yaml
uuid-gracza:
  name: "Pablo"
  package: "vip"
  expires-at: 1710000000000
```

Dla VIP-a permanentnego:

```yaml
uuid-gracza:
  name: "Pablo"
  package: "vip"
  expires-at: -1
```

## Przykładowy config.yml

```yaml
server:
  id: "local-test-server"
  display-name: "MineBox Test Server"

panel:
  enabled: false
  api-url: "http://127.0.0.1:5000/api"
  api-key: "CHANGE_ME"
  sync-interval-seconds: 30

vip:
  enabled: true
  default-duration-days: 30
  permission: "minebox.vip"
  join-message: "&6[%package%] &e%player% &7dołączył na serwer! &8(&7zostało: %remaining%&8)"
  commands-on-remove:
    - "lp user %player% permission unset minebox.vip"
    - "lp user %player% permission unset minebox.svip"
  packages:
    vip:
      display-name: "VIP"
      commands-on-buy:
        - "lp user %player% permission set minebox.vip true"
        - "say %player% kupił rangę VIP na %days% dni!"
    svip:
      display-name: "SVIP"
      commands-on-buy:
        - "lp user %player% permission set minebox.vip true"
        - "lp user %player% permission set minebox.svip true"
        - "say %player% kupił rangę SVIP na %days% dni!"

messages:
  prefix: "&8[&aMineBox&8] &7"
  no-permission: "&cNie masz uprawnień."
  reloaded: "&aKonfiguracja przeładowana."
```

## LuckPerms

Plugin nie wymaga LuckPerms jako zależności.

Jeśli LuckPerms jest zainstalowany, komendy z configu zadziałają:

```text
lp user %player% permission set minebox.vip true
lp user %player% permission set minebox.svip true
```

Jeśli LuckPerms nie ma, plugin nadal działa i zapisuje VIP-y w `vips.yml`, ale same permisje/rangi nie zostaną nadane przez LuckPerms.
