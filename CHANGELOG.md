# Changelog

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

- Naprawiono krytyczny błąd watchdog resetujący ruch co 5 sekund.
- Watchdog nie wywołuje już `hiw:set_idle` podczas aktywnej akcji.
- Dodano fallback AI działający nawet bez skryptu.
- Dodano unikanie gracza przy bardzo małym dystansie.
- Dodano reakcję na podejście i krótki efekt znikania.
- Dodano komendę diagnostyczną `/scriptevent hiw:ping`.
- Dodano wiadomość potwierdzającą uruchomienie rdzenia.
- Zmieniono klucz zapisu na `hiw:state_v10`.
- Skrócono odstępy między akcjami w trybie testowym.
- Zwiększono tolerancję wykrywania utknięcia.
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
