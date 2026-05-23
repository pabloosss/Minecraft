# MineBox — sklepy serwerów, domeny i zarabianie właścicieli

## Założenie

Każdy serwer Minecraft ma własny sklep.

Przykład domyślny:

```text
https://mine-box.pl/sklep/survival-pawla
```

Albo ładniej:

```text
https://survival-pawla.mine-box.pl
```

Dla większych właścicieli można dodać własną domenę:

```text
https://sklep.mojserwer.pl
```

## Model zarabiania

1. Właściciel serwera tworzy produkty w panelu.
2. Gracz kupuje VIP/SVIP/kosmetykę przez sklep.
3. Płatność trafia do MineBox.
4. MineBox pobiera prowizję.
5. Reszta trafia na saldo właściciela serwera.
6. Plugin MineBox Ultimate aktywuje pakiet na serwerze.
7. Właściciel wypłaca środki po osiągnięciu progu, np. 50 zł.

## Przykład

```text
VIP kosztuje 20 zł
Operator płatności pobiera 1 zł
Zostaje 19 zł
MineBox pobiera 20% = 3,80 zł
Właściciel serwera zarabia 15,20 zł
```

## MVP rozliczeń

Na start najlepsze są ręczne wypłaty:

- właściciel widzi saldo,
- klika „Poproś o wypłatę”,
- admin MineBox sprawdza,
- admin robi przelew ręcznie,
- admin oznacza wypłatę jako wypłaconą.

Automatyczne wypłaty można dodać później.

## Lokalna strona

Lokalnie sklep może działać jako:

```text
http://localhost:5000/sklep/survival-pawla
```

Albo przez lokalny wpis w hosts:

```text
127.0.0.1 survival-pawla.mine-box.local
```

Wtedy w przeglądarce:

```text
http://survival-pawla.mine-box.local:5000
```

Do prawdziwych płatności potrzebny jest publiczny HTTPS, np.:

```text
https://survival-pawla.mine-box.pl
```

## Operator płatności

Najlepszy model docelowy: operator z obsługą marketplace/split/payout.

Rekomendacja:

1. MVP: Stripe Checkout + ręczne saldo/wypłaty w MineBox.
2. Docelowo: Stripe Connect do kont właścicieli i wypłat.
3. Alternatywnie dla Polski: Przelewy24 / PayU / Tpay, ale trzeba sprawdzić warunki marketplace i wypłat dla wielu sprzedawców.

## Bezpieczeństwo

- Nie aktywować VIP-a przed potwierdzeniem płatności webhookiem.
- Każde zamówienie musi mieć unikalne ID.
- Plugin nie może sam przyjmować płatności.
- Plugin wykonuje tylko aktywację pakietu.
- Każdy ruch pieniędzy musi być zapisany w historii.
- Przy zwrocie trzeba umieć cofnąć usługę albo oznaczyć zamówienie jako refunded.
