# Plan: domena gracza typu kuba.mine-box.pl

## Cel

Gracz / klient wybiera w panelu nazwę, np.:

```text
kuba
```

Panel pokazuje adres:

```text
kuba.mine-box.pl
```

Docelowo Minecraft działa bez portu dzięki DNS SRV.

## Model techniczny

Jeden VPS może obsługiwać wielu klientów:

```text
kuba.mine-box.pl   -> VPS port 25565 -> tunel do MineBox Kuby
lukasz.mine-box.pl -> VPS port 25566 -> tunel do MineBox Łukasza
adam.mine-box.pl   -> VPS port 25567 -> tunel do MineBox Adama
```

## DNS dla jednego klienta

### A record

```text
A    kuba    31.70.86.109
```

### SRV record

```text
_minecraft._tcp.kuba.mine-box.pl -> kuba.mine-box.pl port 25565
```

Dzięki temu gracz wpisuje tylko:

```text
kuba.mine-box.pl
```

## Etap ręczny MVP

Na start panel tylko zapisuje domenę w konfiguracji:

```text
server_slug = kuba
public_domain = kuba.mine-box.pl
public_port = 25565
```

DNS tworzymy ręcznie w home.pl.

## Etap automatyczny

Docelowo panel / backend powinien:

1. sprawdzić, czy nazwa jest wolna,
2. przypisać port na VPS,
3. utworzyć rekord A,
4. utworzyć rekord SRV,
5. zapisać konfigurację klienta,
6. odpalić tunel na przypisanym porcie.

## Walidacja nazwy

Dozwolone:

```text
a-z
0-9
-
```

Niedozwolone:

```text
spacje
polskie znaki
kropki
znaki specjalne
```

Przykłady poprawne:

```text
kuba
lukasz
serwer-1
survival123
```

Przykłady zablokowane:

```text
admin
panel
www
api
root
minecraft
```

## Co dodać w panelu

Zakładka: Sieć / Domena

Pola:

```text
Nazwa serwera: [kuba]
Domena: kuba.mine-box.pl
Port VPS: 25565
Status DNS: OK / oczekuje
Status tunelu: ONLINE / OFFLINE
```

Przyciski:

```text
Zapisz nazwę
Sprawdź DNS
Kopiuj adres
```

## Uwagi

Na obecnym etapie nie robimy automatycznego API do home.pl. Najpierw wystarczy zapis lokalny w panelu i ręczne DNS.
