# Herobrine: He Is Watching v0.11

Stabilizacyjna wersja addonu Minecraft Bedrock.

## Najwazniejsze zmiany

- automatyczne szukanie miejsca dopuszcza naturalne drzewa i lagodne zbocza;
- budowa korzysta z `system.runJob`, dlatego dluga operacja nie blokuje skryptu;
- nieudany pathfinding Herobrine'a nie zatrzymuje stawiania domu;
- teren jest przygotowywany i poziomowany przed budowa;
- chronione bloki gracza nadal zatrzymuja budowe;
- ksiazka zawiera pelne menu polecen;
- dodano kopanie i przedluzanie tunelu pod domem;
- nowy zapis `hiw:state_v11` usuwa problem starych zawieszonych stanow.

## Polecenia w ksiazce

- Zbuduj dom przede mna
- Wznow budowe domu
- Wykop / rozbuduj tunel
- Patroluj okolice
- Obserwuj mnie
- Nasladuj mnie
- Zetnij drzewo
- Wroc do domu
- Zostaw czerwony znak
- Stoj w ciemnym domu
- Zatrzymaj obecna czynnosc

## Komendy testowe

```text
/scriptevent hiw:ping
/scriptevent hiw:menu
/scriptevent hiw:spawn
/scriptevent hiw:build
/scriptevent hiw:resume
/scriptevent hiw:tunnel
/scriptevent hiw:patrol
/scriptevent hiw:observe
/scriptevent hiw:mimic
/scriptevent hiw:chop
/scriptevent hiw:home
/scriptevent hiw:warning
/scriptevent hiw:stop
/scriptevent hiw:reset
```

## Test budowy

1. Stan na otwartym terenie.
2. Patrz w strone miejsca, gdzie ma powstac dom.
3. Otworz Dziennik Herobrine'a.
4. Polecenia -> Zbuduj dom przede mna.
5. Dom powstanie okolo 12-19 blokow przed graczem.
6. Po ukonczeniu wybierz Wykop / rozbuduj tunel.

## Bezpieczenstwo

Tryb bezpieczny jest domyslnie wlaczony. Budowa domu i tunelu zatrzymuje
sie przy wykryciu skrzyn, piecow, desek, drzwi, szkla, redstone i innych
blokow wygladajacych na konstrukcje gracza.

Nie testuj pierwszej wersji na jedynej kopii waznego swiata.
