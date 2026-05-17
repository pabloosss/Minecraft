# MineBox Panel Hostingu

Osobny folder pod przyszły panel logowania klientów i zarządzania kupionymi hostingami oraz fizycznymi MineBoxami.

## Co robi wersja startowa

- logowanie użytkownika,
- dashboard z serwerami Minecraft,
- status serwera: online / offline,
- przyciski: Start, Stop, Restart, Backup,
- miejsce pod API dla fizycznego MineBoxa,
- miejsce pod agenta działającego na urządzeniu stojącym u klienta.

## Ważne

Tego nie wrzucamy na zwykły hosting Apache jako statyczną stronę.
Panel musi działać na VPS albo na Twoim serwerze z Pythonem.

Strona reklamowa zostaje w:

```text
strona-www/
```

Panel techniczny jest tutaj:

```text
panel-hostingu/
```

## Jak uruchomić lokalnie

```bash
cd panel-hostingu
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Potem wejść w przeglądarce:

```text
http://127.0.0.1:5000
```

## Dane logowania

Dane logowania ustawiamy przez zmienne środowiskowe. Nie wpisujemy prawdziwych haseł w kodzie ani w repozytorium.

Wymagane zmienne docelowo:

```text
MINEBOX_ADMIN_EMAIL
MINEBOX_ADMIN_PASSWORD
MINEBOX_SECRET_KEY
MINEBOX_AGENT_TOKEN
```

## Docelowa architektura

```text
Klient
  ↓
panel.mine-box.pl
  ↓
MineBox Cloud / API
  ↓
Agent na fizycznym MineBoxie
  ↓
Serwer Minecraft
```

Agent na fizycznym MineBoxie będzie cyklicznie pytał panel, czy ma wykonać akcję:

```text
start
stop
restart
backup
status
```

Dzięki temu urządzenie może stać gdzieś daleko, np. u klienta w domu, a Ty nadal widzisz status i możesz nim zarządzać z panelu.
