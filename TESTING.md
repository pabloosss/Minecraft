# Testowanie v0.11

## Test podstawowy

1. Zaimportuj paczke.
2. W nowym swiecie wlacz paczke zachowan i zasobow.
3. Wpisz `/scriptevent hiw:ping`.
4. Wynik powinien zawierac `Skrypt v0.11 dziala`.
5. Przywolaj Herobrine'a przez ksiazke albo `/scriptevent hiw:spawn`.

## Test domu

1. Stan na otwartym terenie.
2. Patrz przed siebie.
3. Ksiazka -> Polecenia -> Zbuduj dom przede mna.
4. Status powinien przejsc przez `preparing`, `building`, `complete`.
5. Nieudane dojscie Herobrine'a nie moze zatrzymac budowy.

## Test tunelu

1. Poczekaj na status domu `complete`.
2. Ksiazka -> Wykop / rozbuduj tunel.
3. Pierwsze uzycie tworzy schody i 12 blokow tunelu.
4. Kolejne uzycie przedluza tunel o 12 blokow.

## Diagnostyka

- `/scriptevent hiw:status`
- `/scriptevent hiw:ping`
- wlacz Debug w ksiazce;
- Content Log GUI/File w ustawieniach tworcy.
