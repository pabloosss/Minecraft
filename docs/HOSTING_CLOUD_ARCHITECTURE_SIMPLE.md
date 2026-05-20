# MineBox Cloud — proste wyjaśnienie architektury

## Dwa różne produkty

### 1. Fizyczny MineBox

Klient ma pudełko/urządzenie u siebie w domu albo biurze.

```text
MineBox klienta
↓ tunel
VPS Gateway
↓ domena
kuba.mine-box.pl
```

Tu VPS nie hostuje Minecrafta. VPS tylko daje publiczne wejście i domenę.

### 2. MineBox Cloud / wirtualny hosting

Klient nie ma pudełka. Serwer Minecraft działa u nas na osobnym serwerze.

```text
Klient kupuje pakiet
↓
panel.mine-box.pl
↓
Game Node / dedyk
↓
serwer Minecraft klienta
↓
kuba.mine-box.pl
```

## Gdzie postawić hosting wirtualny

Nie na obecnym VPS gateway.

Obecny VPS zostaje jako:

```text
brama / domeny / proxy / tunele
```

Hosting gier stawiamy na osobnym serwerze:

```text
Game Node 1
```

Minimalnie do testów:

```text
4 vCPU
8–16 GB RAM
NVMe
Linux
```

Docelowo:

```text
dedyk Ryzen / mocny single-core
32–64 GB RAM
NVMe
DDoS protection
backup storage
```

## Gdzie użytkownik się loguje

Użytkownik loguje się do panelu webowego:

```text
https://panel.mine-box.pl
```

Tam wpisuje:

```text
e-mail
hasło
```

W panelu widzi swoje serwery.

## Gdzie użytkownik łączy się w Minecraft

W Minecraft wpisuje adres serwera:

```text
kuba.mine-box.pl
```

albo nazwę wybraną przy zakupie:

```text
survival-kuby.mine-box.pl
```

## Co jest w panelu klienta

Klient widzi:

```text
START
STOP
RESTART
Konsola
Pliki
Backupy
Pluginy
Ustawienia
Domena
```

## Jak to działa technicznie

### Panel centralny

```text
panel.mine-box.pl
```

Panel przechowuje:

```text
użytkownicy
hasła / logowanie
pakiety
serwery klienta
subdomeny
płatności
```

### Game Node

Na Game Node działają realne serwery Minecraft klientów.

```text
Game Node
├─ serwer_kuba
├─ serwer_adam
├─ serwer_ola
└─ serwer_testowy
```

### VPS Gateway

VPS Gateway dalej może robić:

```text
DNS / proxy / routing / status / tunele fizycznych MineBoxów
```

## Najprostsza droga startu

Na początek najlepiej:

```text
1. Fizyczny MineBox rozwijać dalej.
2. VPS zostawić jako gateway.
3. Do MineBox Cloud postawić osobny Game Node.
4. Na Game Node dać Pterodactyl albo podobny panel jako backend.
5. MineBox Panel może być ładnym frontendem / marką.
```

## Dlaczego Pterodactyl na start

Bo ma gotowe:

```text
konta użytkowników
limity RAM/CPU/dysk
serwery per klient
pliki
konsolę
backupy
Docker izolację
```

Dzięki temu nie trzeba od zera pisać bezpieczeństwa i izolacji klientów.

## Finalna architektura

```text
mine-box.pl
├─ panel.mine-box.pl        → panel klienta
├─ *.mine-box.pl            → domeny serwerów
│
├─ VPS Gateway              → domeny, proxy, tunele
│
├─ Game Node 1              → hosting wirtualny
│   ├─ kuba.mine-box.pl
│   ├─ adam.mine-box.pl
│   └─ ola.mine-box.pl
│
└─ Fizyczne MineBoxy         → urządzenia klientów przez tunnel
```

## Najważniejszy wniosek

Obecny VPS nie powinien hostować gier klientów. Powinien zostać bramą.

Serwery wirtualne klientów powinny działać na osobnym Game Node albo dedyku.
