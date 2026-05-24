# Jak pobrać tylko plugin-minecraft z GitHuba

Nie trzeba pobierać całego repo z WWW i innymi rzeczami.

Na MineBox VM można pobrać tylko folder `plugin-minecraft` przez sparse checkout.

## Pierwsze pobranie

```bash
cd /home/vboxuser
mkdir minebox-plugin-src
cd minebox-plugin-src

git init
git remote add origin https://github.com/pabloosss/Minecraft.git
git sparse-checkout init --cone
git sparse-checkout set plugin-minecraft
git pull origin main
```

Po tym będziesz mieć tylko:

```text
/home/vboxuser/minebox-plugin-src/plugin-minecraft
```

## Build i instalacja

```bash
cd /home/vboxuser/minebox-plugin-src/plugin-minecraft
chmod +x build-and-install.sh
./build-and-install.sh
```

Skrypt zbuduje:

```text
build/libs/MineBoxUltimate.jar
```

I skopiuje go do:

```text
/home/vboxuser/minebox/server/plugins/MineBoxUltimate.jar
```

## Aktualizacja później

```bash
cd /home/vboxuser/minebox-plugin-src
git pull origin main
cd plugin-minecraft
./build-and-install.sh
```

## Najważniejsze

- GitHub trzyma kod źródłowy.
- Gradle buduje tylko plugin w folderze `plugin-minecraft`.
- Minecraft dostaje tylko plik `.jar`.
- WWW i inne foldery nie trafiają do `plugins`.
