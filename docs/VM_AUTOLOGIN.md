# MineBox VM — automatyczne logowanie vboxuser

## Cel

Po uruchomieniu VM użytkownik nie chce ręcznie logować się jako `vboxuser`.

## Ważne

Dla usług MineBox nie jest konieczne logowanie graficzne, jeśli używamy `systemd --user` i `loginctl enable-linger`.

Docelowo VM ma działać tak:

```text
start VM
↓
systemd user odpala usługi vboxuser
↓
Minecraft + panel + tunel startują same
```

## Najlepsza opcja

Włączyć linger dla użytkownika:

```bash
sudo loginctl enable-linger vboxuser
```

Dzięki temu usługi `systemctl --user` mogą działać bez aktywnego logowania użytkownika.

## Sprawdzenie

```bash
loginctl show-user vboxuser | grep Linger
```

Oczekiwane:

```text
Linger=yes
```

## Autologin do konsoli — opcjonalnie

Nie jest wymagany dla MineBoxa, ale można zrobić później, jeśli VM ma automatycznie pokazywać pulpit/konsolę.

## Priorytet

Najpierw:

1. `loginctl enable-linger vboxuser`
2. upewnić się, że `minebox-minecraft.service` jest enabled
3. upewnić się, że `minebox-panel.service` jest enabled
4. potem zrobić `minebox-tunnel.service`

## Wniosek

Nie trzeba koniecznie robić klasycznego auto-logowania do systemu. Lepiej włączyć linger, żeby usługi startowały bez logowania użytkownika.