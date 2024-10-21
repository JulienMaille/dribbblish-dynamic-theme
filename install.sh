#!/bin/sh

set -e

echo "Patching (1/4)"
PATCH='[Patch]
xpui.js_find_8008 = ,(\\w+=)32,
xpui.js_repl_8008 = ,\${1}28,'
cd "$(dirname "$(spicetify -c)")"
if cat config-xpui.ini | grep -o '\[Patch\]'; then
    while true; do
        read -p "Existing Spicetify patches will be overwritten. Do you wish to continue? [y/n] " yn </dev/tty
        case $yn in
        [Yy]*) break ;;
        [Nn]*) exit ;;
        *) echo "Please answer yes or no." ;;
        esac
    done

    perl -i -0777 -pe "s/\[Patch\].*?($|(\r*\n){2})/${PATCH}\n\n/s" config-xpui.ini
else
    echo "\n${PATCH}" >>config-xpui.ini
fi

echo "Finding lastest version (2/4)"
if [ $# -eq 0 ]; then
    latest_release_uri="https://api.github.com/repos/JulienMaille/dribbblish-dynamic-theme/releases/latest"
    version=$(command curl -sSf "$latest_release_uri" |
        command grep -Eo "tag_name\": .*" |
        command grep -Eo "[0-9.]+")
    if [ ! "${version}" ]; then exit 1; fi
else
    version="${1}"
fi

echo "Downloading v${version} (3/4)"
# Setup directories to download to
theme_dir="$(dirname "$(spicetify -c)")/Themes/DribbblishDynamic"
ext_dir="$(dirname "$(spicetify -c)")/Extensions"

# Make directories if needed
mkdir -p "${theme_dir}"
mkdir -p "${ext_dir}"

# Download latest tagged files into correct directories
curl --progress-bar --output "${theme_dir}/color.ini" "https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/${version}/color.ini"
curl --progress-bar --output "${theme_dir}/user.css" "https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/${version}/user.css"
curl --progress-bar --output "${ext_dir}/dribbblish-dynamic.js" "https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/${version}/dribbblish-dynamic.js"
curl --progress-bar --output "${ext_dir}/Vibrant.min.js" "https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/${version}/Vibrant.min.js"

echo "Applying theme (4/4)"
spicetify config extensions default-dynamic.js-
spicetify config extensions dribbblish-dynamic.js extensions Vibrant.min.js
spicetify config current_theme DribbblishDynamic color_scheme base
spicetify config inject_css 1 replace_colors 1
spicetify apply

echo "All done!"
