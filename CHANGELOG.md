# Changelog

## 0.14.0

- Przebudowano pathfinding na segmenty.
- Dodano obchodzenie przeszkod po utknieciu.
- Dodano osobne tryby walk/sprint.
- Dodano anulowanie starych akcji.
- Dodano polecenia come, follow, wait i guard.
- Dodano naprawe oraz inspekcje domu.
- Dodano ustawienia ruchu, tempa budowy, autonomii i straszenia.
- Rozszerzono ratowanie z blokow na zwykle akcje.
- Zmieniono stan swiata na v14.

## 0.13.0

- Zastapiono `system.runJob` dokladnym harmonogramem `system.runTimeout`.
- Dom jest stawiany po jednym bloku co 6 tickow.
- Tunel jest kopany po jednej operacji co 5 tickow.
- Dodano bezpieczne stanowiska pracy poza obrysem domu.
- Ruch do stanowiska konczy sie przed rozpoczeciem stawiania blokow.
- Dodano osobny tryb encji `hiw:work`.
- Usunieto konflikt random stroll, unikania gracza i pathfindingu.
- Usunieto `minecraft:can_climb`.
- Dodano odpornosc na wszystkie obrazenia.
- Dodano automatyczne leczenie i wyciaganie ze scian.
- Dodano pojedynczy teleport awaryjny zamiast drgania i teleportowania co tick.
- Tunel jest kopany z bezpiecznego wejscia.
- Dodano migracje stanu z v0.12.

## 0.12.0

- Naprawiono nieprawidlowe ID `minecraft:nether_bricks`.
- Uzyto poprawnego ID Bedrock `minecraft:nether_brick`.
- Wznowiona budowa pomija poprawnie juz postawione bloki.
- Wlasna skrzynia i inne elementy domu nie sa juz uznawane za chronione.
- Wylaczono automatyczne ponawianie zatrzymanej budowy.
- Usunieto petle spamujaca tym samym bledem na czacie.
- Dodano migracje stanu swiata z v0.11 do v0.12.
- Dodano test walidatora dla nieprawidlowego ID netherowych cegiel.

## 0.11.0

- Przebudowano budowe domu na `system.runJob`.
- Pathfinding nie jest juz warunkiem kontynuowania budowy.
- Poluzowano wyszukiwanie terenu: dozwolone sa drzewa i zbocza do 3 blokow.
- Dodano reczne polecenie budowy domu przed graczem.
- Dodano generator schodow i tunelu 2x3.
- Tunel mozna przedluzac po 12 blokow.
- Dodano podpory, podloge i czerwone pochodnie w tunelu.
- Dodano menu polecen do Dziennika Herobrine'a.
- Dodano polecenia: patrol, obserwacja, nasladowanie, drzewo, dom, znak i stop.
- Dodano komendy skryptowe odpowiadajace przyciskom w ksiazce.
- Dodano stan i diagnostyke tunelu.
- Zmieniono klucz zapisu na `hiw:state_v11`.

## 0.10.0

- Naprawiono krytyczny blad watchdog resetujacy ruch co 5 sekund.
- Watchdog nie wywoluje juz `hiw:set_idle` podczas aktywnej akcji.
- Dodano fallback AI dzialajacy nawet bez skryptu.
- Dodano unikanie gracza przy bardzo malym dystansie.
- Dodano reakcje na podejscie i krotki efekt znikania.
- Dodano komende diagnostyczna `/scriptevent hiw:ping`.
- Dodano wiadomosc potwierdzajaca uruchomienie rdzenia.
- Zmieniono klucz zapisu na `hiw:state_v10`.
- Skrocono odstepy miedzy akcjami w trybie testowym.
- Zwiekszono tolerancje wykrywania utkniecia.
- Ustawiono `@minecraft/server-ui` 2.1.0.

## 0.9.0

- Updated target to Bedrock 26.30+ and `@minecraft/server` 2.8.0.
- Replaced per-tick scripted teleport movement with native waypoint pathfinding.
- Added singleton protection for Herobrine and orphan waypoint cleanup.
- Added persistent JSON state with schema migration-safe defaults.
- Added resumable house construction with obstruction checks and one-action lock.
- Added cabin and watchtower blueprints made only from orientation-safe full blocks.
- Added configurable activity, Safe Mode, building, interference, debug and house variant.
- Added journal UI, script-event commands, Content Log diagnostics and watchdog recovery.
- Added stable actions: home routine, patrol, observation, mimicry, warning torch, tree activity and dark-house stare.
