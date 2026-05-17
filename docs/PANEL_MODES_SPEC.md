# MineBox Panel — tryb prosty i zaawansowany

## Cel

Panel ma mieć dwa tryby pracy:

1. **Tryb prosty** — ekran startowy dla zwykłego użytkownika.
2. **Tryb zaawansowany** — pełny panel administracyjny dla technicznej konfiguracji.

Panel ma po wejściu pokazywać tryb prosty. Tryb zaawansowany ma być dostępny przyciskiem.

## Tryb prosty

Ma zawierać tylko najważniejsze rzeczy:

- status serwera Minecraft,
- status publicznego dostępu,
- domenę serwera,
- przyciski START / STOP / RESTART,
- kopię adresu,
- prostą konsolę komend,
- ostatnie logi,
- backup teraz,
- informację czy tunel działa.

Nie ma pokazywać technicznych rzeczy typu systemd, screen, ścieżki plików, procesy Java.

## Tryb zaawansowany

Ma zawierać pełną konfigurację:

- dashboard techniczny,
- konsola,
- ustawienia server.properties,
- silnik i wersja,
- pluginy,
- paczki,
- światy,
- backupy,
- sieć i domena,
- automatyzacja,
- bezpieczeństwo,
- status usług systemd,
- status screen,
- status tunelu,
- logi.

## Zasada UI

Nie używać placeholderów typu „wkrótce” jako głównej funkcji. Jeśli coś nie działa, pokazać to jako „Planowane” albo ukryć przycisk działania.

## Etap Alpha

W Alpha robimy jeden plik `app.py`, ale docelowo rozbijamy na:

```text
routes/
modules/
templates/
static/
```

## Ważne

Panel pozostaje lokalny LAN. Nie wystawiać go na internet bez logowania.