# MineBox — lista grafik do wygenerowania

## Założenie

Panel ma działać stabilnie offline/LAN, więc grafiki powinny być lokalne w:

```text
static/img/
```

Nie opierać UI na zewnętrznych obrazkach.

## Najważniejsze grafiki MVP

### 1. Logo MineBox

- format: PNG albo SVG
- rozmiar: 512x512
- styl: pixel art / Minecraft-inspired
- opis: zielony grass block + mały serwer/box + napis MineBox opcjonalnie
- plik: `static/img/logo-minebox.png`

### 2. Hero background

- format: WEBP albo PNG
- rozmiar: 1920x720
- styl: ciemny Minecraft landscape, trawa, bloki, delikatna poświata, bez postaci z licencji
- plik: `static/img/hero-minecraft-bg.webp`

### 3. Simple mode illustration

- format: PNG
- rozmiar: 1200x800
- styl: friendly plug-and-play Minecraft server box, kabel internetowy, zielona dioda online
- plik: `static/img/simple-mode-box.png`

### 4. Advanced mode illustration

- format: PNG
- rozmiar: 1200x800
- styl: terminal, serwer rack, tunele, sieć, bardziej techniczny klimat
- plik: `static/img/advanced-mode-tech.png`

### 5. Status online icon

- format: SVG/PNG
- rozmiar: 256x256
- styl: zielona kostka z checkmarkiem
- plik: `static/img/status-online.png`

### 6. Status offline icon

- format: SVG/PNG
- rozmiar: 256x256
- styl: czerwona kostka z krzyżykiem
- plik: `static/img/status-offline.png`

### 7. Backup icon

- format: SVG/PNG
- rozmiar: 256x256
- styl: skrzynka Minecraft + dysk/strzałka backupu
- plik: `static/img/icon-backup.png`

### 8. Plugins icon

- format: SVG/PNG
- rozmiar: 256x256
- styl: puzzle/block/plugin jar
- plik: `static/img/icon-plugins.png`

### 9. World icon

- format: SVG/PNG
- rozmiar: 256x256
- styl: mała planeta z bloków Minecraft
- plik: `static/img/icon-world.png`

### 10. Network/tunnel icon

- format: SVG/PNG
- rozmiar: 256x256
- styl: portal/tunel z kostek, linia do chmury/VPS
- plik: `static/img/icon-network.png`

## Dodatkowe grafiki później

- `static/img/preset-survival.png`
- `static/img/preset-hardcore.png`
- `static/img/preset-creative.png`
- `static/img/preset-skyblock.png`
- `static/img/preset-pvp.png`
- `static/img/plugin-essentials.png`
- `static/img/plugin-luckperms.png`
- `static/img/plugin-worldedit.png`

## Ważne prawnie

Nie używać oficjalnego logo Minecraft ani grafik Mojang/Microsoft. Styl ma być inspirowany voxel/pixel/block, ale oryginalny.
