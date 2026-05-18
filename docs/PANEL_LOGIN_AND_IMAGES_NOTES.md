# MineBox Panel — logowanie i grafiki

## Zgłoszone problemy

Użytkownik zauważył:

- niektóre grafiki w panelu / stronie się nie ładują,
- panel nie ma logowania,
- panel powinien mieć dwa tryby: prosty i zaawansowany.

## Decyzja

Panel lokalny dalej zostaje w LAN, ale logowanie warto dodać już teraz, bo później może pojawić się `panel.mine-box.pl`.

## Tryby panelu

### Tryb prosty

Domyślny po wejściu:

- status Minecraft,
- domena,
- gracze,
- START / STOP / RESTART,
- backup teraz,
- prosta konsola,
- podstawowe ustawienia.

### Tryb zaawansowany

Dla admina:

- screen,
- systemd,
- tunnel,
- logi,
- pełne `server.properties`,
- pluginy,
- paczki,
- backupy,
- automatyzacja,
- bezpieczeństwo.

## Grafiki

Nie polegać na zewnętrznych grafikach, bo mogą się nie ładować.

Na start używać:

- CSS pixel art,
- emoji / ikony tekstowe,
- lokalne pliki w `static/img/`.

## Logowanie Alpha

Na start wystarczy proste logowanie sesyjne Flask:

- hasło w `config.json`,
- domyślnie lokalne,
- `MINEBOX_PANEL_PASSWORD` jako zmienna środowiskowa w przyszłości,
- strona `/login`,
- `/logout`,
- ochrona endpointów API.

## Uwaga bezpieczeństwa

Nie zapisywać hasła jawnie docelowo. W Alpha można użyć prostego hasła testowego, potem hash.