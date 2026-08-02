# Herobrine: He Is Watching v0.14

Stabilizacyjna i rozbudowana wersja addonu Minecraft Bedrock.

## Najwazniejsze zmiany

- natywny pathfinding zostal podzielony na krotkie odcinki;
- po utknieciu Herobrine probuje obejsc przeszkode z lewej lub prawej;
- osobne tryby chodzenia i sprintu;
- zwiekszony promien zatrzymania ogranicza drzenie przy celu;
- wszystkie akcje maja token anulowania, wiec stare polecenie nie dziala po wydaniu nowego;
- dodano tryb ostroznego, normalnego i szybkiego ruchu;
- dodano samodzielne akcje WL./WYL.;
- dodano wylacznik straszenia z bliska i ratowania z blokow;
- dodano wolne, normalne i szybkie tempo budowy;
- dodano sprawdzanie i naprawe domu blok po bloku.

## Nowe polecenia w ksiazce

### Ruch i obecnosc

- Podejdz do mnie
- Podazaj za mna przez 35 sekund
- Czekaj tutaj przez 60 sekund
- Patroluj okolice
- Pilnuj domu
- Wroc do domu
- Wyciagnij z blokow

### Interakcje

- Obserwuj mnie z oddali
- Nasladuj mnie
- Zetnij drzewo
- Zostaw czerwony znak
- Stoj w ciemnym domu

### Budowa

- Zbuduj lub wznow dom
- Wykop/przedluz tunel
- Sprawdz stan domu
- Napraw brakujace bloki domu

## Komendy

```text
/scriptevent hiw:ping
/scriptevent hiw:menu
/scriptevent hiw:spawn
/scriptevent hiw:build
/scriptevent hiw:resume
/scriptevent hiw:tunnel
/scriptevent hiw:repair
/scriptevent hiw:inspect
/scriptevent hiw:come
/scriptevent hiw:follow
/scriptevent hiw:wait
/scriptevent hiw:patrol
/scriptevent hiw:guard
/scriptevent hiw:observe
/scriptevent hiw:mimic
/scriptevent hiw:chop
/scriptevent hiw:home
/scriptevent hiw:warning
/scriptevent hiw:rescue
/scriptevent hiw:stop
/scriptevent hiw:reset
```

## Bezpieczenstwo

Testuj na kopii swiata. Tryb bezpieczny i ratowanie z blokow sa domyslnie wlaczone.
