# MineBox / Minecraft Server Panel

Repozytorium zapisuje aktualny stan prototypu MineBox.

## Co już działa

- Panel WWW na lokalnej VM VirtualBox.
- Start / stop / restart serwera Minecraft z panelu Flask.
- PaperMC / Vanilla jako silniki testowe.
- Presety: Survival, Creative, PvP Lite, SkyBlock placeholder.
- Reverse SSH tunnel z lokalnej VM do VPS home.pl.
- Publiczne wejście do serwera przez `31.70.86.109:25565`.
- Domena testowa: `test.mine-box.pl` wskazuje rekordem A na VPS.

## Aktualna architektura

```text
Gracz Minecraft
↓
31.70.86.109:25565 / test.mine-box.pl:25565
↓
VPS home.pl
↓ reverse SSH tunnel
MineBox VM / VirtualBox
↓
Minecraft server :25565
```

## Ważne adresy

```text
Lokalny panel: http://192.168.1.42:5000
Lokalny Minecraft: 192.168.1.42:25565
Publiczny Minecraft: 31.70.86.109:25565
Domena testowa: test.mine-box.pl
```

## Foldery

```text
vm/   - pliki i komendy dla lokalnej VM MineBox
vps/  - konfiguracja i komendy dla VPS home.pl
dns/  - notatki DNS dla domeny mine-box.pl
docs/ - opis architektury i dalsze kroki
```

## Uwaga bezpieczeństwa

Nie wrzucać prywatnych kluczy SSH, haseł ani plików typu `minebox_vps` bez `.pub`.
