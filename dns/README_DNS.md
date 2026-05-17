# DNS / mine-box.pl

## Aktualna domena

```text
mine-box.pl
```

## Rekord testowy

```text
test.mine-box.pl -> 31.70.86.109
```

## Rekord A

```text
Typ: A
Host: test.mine-box.pl.
Dane: 31.70.86.109
TTL: 3600
```

## Test DNS

Windows:

```powershell
nslookup test.mine-box.pl 8.8.8.8
```

## Docelowo

Dodanie rekordu SRV dla Minecraft:

```text
_mc._tcp.test.mine-box.pl
```

aby działało:

```text
test.mine-box.pl
```

bez wpisywania portu.
