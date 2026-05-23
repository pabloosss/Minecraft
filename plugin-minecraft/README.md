# MineBox Ultimate Plugin

Jeden główny plugin do połączenia serwera Minecraft z panelem MineBox.

## Co ma robić

- łączyć serwer Minecraft z panelem MineBox,
- wysyłać status serwera do panelu,
- pokazywać liczbę graczy online,
- obsługiwać komendy administracyjne,
- obsługiwać pakiety VIP / SVIP,
- wykonywać komendy po zakupie pakietu,
- przygotować bazę pod przyszłe funkcje: sklep, whitelist, backupy, statystyki, integrację Discord.

## Technologia

- Java 17
- Gradle
- Paper API 1.20.4

## Budowanie pluginu

W folderze `plugin-minecraft`:

```bash
./gradlew build
```

Na Windowsie:

```powershell
gradlew.bat build
```

Gotowy plik `.jar` będzie w:

```text
build/libs/MineBoxUltimate-0.1.0-SNAPSHOT.jar
```

## Instalacja na serwerze

1. Zbuduj plugin.
2. Wrzuć plik `.jar` do folderu `plugins` na serwerze Paper.
3. Uruchom serwer.
4. Edytuj `plugins/MineBoxUltimate/config.yml`.
5. Ustaw `panel.enabled: true`, `api-url`, `api-key` i `server.id`.
6. Zrestartuj serwer albo użyj `/minebox reload`.

## Komendy

```text
/minebox status
/minebox reload
/minebox sync
/minebox vip give <gracz> <pakiet>
/vip
```

## Kupowanie VIP-a

Na teraz plugin ma przygotowany prosty mechanizm:

```text
/minebox vip give Steve vip
/minebox vip give Steve svip
```

Panel MineBox docelowo powinien po płatności wysłać do serwera albo agenta informację:

```json
{
  "player": "Steve",
  "package": "vip"
}
```

A serwer wykona komendy z `config.yml`, np. przez LuckPerms:

```yaml
commands-on-buy:
  - "lp user %player% permission set minebox.vip true"
  - "say %player% kupił rangę VIP!"
```

## Ważne

Do rang najlepiej użyć LuckPerms. Ten plugin ma być łącznikiem MineBox ↔ Minecraft, a nie pełnym systemem permission od zera.
