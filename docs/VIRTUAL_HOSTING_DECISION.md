# MineBox — decyzja: wirtualny hosting serwerów Minecraft

## Pytanie

Czy do dodatkowego wirtualnego hostingu dla klientów używać tego samego VPS, innego VPS, czy kupić osobny serwer/dedyk?

## Krótka odpowiedź

Nie używać obecnego VPS jako hostingu gier.

Obecny VPS powinien zostać jako:

```text
VPS Gateway / tunel / domeny / proxy / panel centralny
```

Do realnego hostingu serwerów Minecraft potrzebny będzie osobny serwer z większym CPU/RAM/NVMe.

## Dlaczego nie ten sam VPS?

Obecny VPS jest dobry jako brama publiczna dla fizycznych MineBoxów, ale hosting Minecrafta zużywa dużo:

- RAM,
- CPU jednowątkowego,
- dysku NVMe,
- I/O,
- ochrony DDoS.

Jeśli wrzucimy klientów hostingowych na ten sam VPS, to:

- może paść tunel dla fizycznych MineBoxów,
- mogą lagować serwery,
- będzie trudniej diagnozować problemy,
- jeden awaryjny klient obciąży całą bramę.

## Zalecana architektura

```text
mine-box.pl DNS
        ↓
VPS Gateway
- domeny
- proxy
- tunnel hub
- status
- ewentualnie panel centralny
        ↓
Dedicated / Game Node 1
- serwery klientów wirtualnych
- Docker/Pterodactyl/Wings albo własny agent
        ↓
Dedicated / Game Node 2 później
```

## Etapy

### Etap 1 — obecny VPS

Zostaje dla MineBox fizycznych:

- reverse SSH tunnel,
- wildcard DNS,
- routing,
- status,
- panel centralny w przyszłości.

### Etap 2 — mały test hostingu wirtualnego

Można zrobić test na osobnym VPS/game VPS, ale nie na obecnym gatewayu.

Minimalnie:

- 4 vCPU,
- 8–16 GB RAM,
- NVMe,
- dobry single-core,
- backupy.

### Etap 3 — prawdziwy hosting

Kupić dedyk/game server:

- mocny CPU single-core,
- 32–64 GB RAM,
- NVMe,
- dobra sieć,
- DDoS protection,
- backup storage.

## Panel

Do hostingu wirtualnego są dwie drogi:

### Opcja A — Pterodactyl

Szybciej wystartować sprzedaż.

Plusy:

- gotowy panel,
- konta klientów,
- serwery per klient,
- limity RAM/CPU/dysk,
- konsola,
- restart,
- pliki,
- backupy.

Minus:

- mniej własnego produktu,
- trzeba integrować z MineBox brandingiem.

### Opcja B — własny panel MineBox

Lepsze jako produkt docelowy.

Plusy:

- pełna kontrola,
- jeden panel dla fizycznych MineBoxów i cloud hostingu,
- własna marka.

Minus:

- dużo więcej pracy,
- bezpieczeństwo, izolacja i billing trzeba zrobić samemu.

## Rekomendacja

Najlepsza ścieżka:

```text
1. Obecny VPS zostaje jako Gateway.
2. Fizyczne MineBoxy rozwijać dalej.
3. Dla wirtualnego hostingu postawić osobny game node.
4. Na start rozważyć Pterodactyl jako backend hostingowy.
5. Panel MineBox może być nakładką/launcherem/produktem UX.
```

## Ważne rozdzielenie produktów

### Produkt A — fizyczny MineBox

Klient ma urządzenie u siebie.

```text
MineBox klienta → tunnel → VPS Gateway → domena
```

### Produkt B — MineBox Cloud

Serwer działa u nas.

```text
Game Node / dedyk → domena klienta → panel
```

Nie mieszać obciążenia obu produktów na jednym małym VPS.
