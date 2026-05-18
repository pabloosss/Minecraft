# MineBox — dostęp z innego komputera

## Problem

Użytkownik jest na innym komputerze niż ten, na którym był wygenerowany klucz SSH do VPS.

Stary klucz był w profilu Windows:

```text
C:\Users\Pablo\.ssh\minebox_vps
```

Na nowym komputerze/profilu tego pliku nie ma.

## Co to oznacza

Bez prywatnego klucza SSH nie da się zalogować do VPS jako `root`, jeśli VPS akceptuje tylko `publickey`.

## Opcje

### Opcja A — skopiować stary klucz

Najprościej, jeśli mamy dostęp do starego komputera:

```text
C:\Users\Pablo\.ssh\minebox_vps
C:\Users\Pablo\.ssh\minebox_vps.pub
```

Skopiować bezpiecznie na nowy komputer do:

```text
C:\Users\pawel.ruchlicki\.ssh\minebox_vps
C:\Users\pawel.ruchlicki\.ssh\minebox_vps.pub
```

### Opcja B — wygenerować nowy klucz

Na nowym komputerze:

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\minebox_vps
```

Potem publiczny klucz:

```powershell
type $env:USERPROFILE\.ssh\minebox_vps.pub
```

Ten publiczny klucz trzeba dodać do VPS w panelu dostawcy / konsoli ratunkowej / przez stare działające logowanie.

## FileZilla VPS

Po posiadaniu klucza:

```text
Protokół: SFTP
Host: 31.70.86.109
Port: 22
Typ logowania: Plik klucza
Użytkownik: root
Plik klucza: C:\Users\pawel.ruchlicki\.ssh\minebox_vps
```

## Ważne

Nigdy nie wrzucać prywatnego klucza SSH na GitHub ani do czatu.
