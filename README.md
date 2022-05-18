# ❗Dribbblish Dynamic development is on hold❗
**Due to the many changes made by Spotify, Spicetify's functionality is regularly compromised.
And when it is restored, this theme requires updates and complete rewrites of certain portions of the code.
Since I don't have time to do weekly maintenance, I prefer to put this repository on pause.
If you have the will and the skills to contribute to the patches, you can contact me.**

# Dribbblish Dynamic
A theme for [Spicetify](https://github.com/khanhas/spicetify-cli)

<a href="https://github.com/JulienMaille/dribbblish-dynamic-theme/releases/latest"><img src="https://img.shields.io/github/release/JulienMaille/dribbblish-dynamic-theme/all.svg"></a>
<a href="https://github.com/JulienMaille/dribbblish-dynamic-theme/releases"><img src="https://img.shields.io/github/downloads/JulienMaille/dribbblish-dynamic-theme/total.svg"></a>

### Preview

<img src="https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/main/showcase-images/preview.gif" alt="img" width="500px"> 

##  Features
### Resizable sidebar

<img src="https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/main/showcase-images/resize-sidebar.png" alt="img" width="500px"> 

### Customizable sidebar
Rearrange icons positions, stick icons to header or hide unnecessary to save space.
Turn on "Sidebar config" mode in Profile menu and hover on icon to show control buttons.
After you finish customizing, turn off Config mode in Profile menu to save.

<img src="https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/main/showcase-images/customize-sidebar.png" alt="img" width="500px"> 

### Playlist Folder image
Right click at folder and choose images for your playlist folder. Every image formats supported by Chrome can be used, but do keep image size small and in compressed format.

<img src="https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/main/showcase-images/playlist-folders.gif" alt="img" width="500px"> 

### Left/Right expanded cover
In profile menu, toggle option "Right expanded cover" to change expanded current track cover image to left or right side, wherever you prefer.

## Install / Update
Make sure you are using latest releases of Spicetify and Spotify

### Windows (PowerShell)
```powershell
Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/master/install.ps1" | Invoke-Expression
```

### Linux/MacOS (Bash)
```bash
curl -fsSL https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/master/install.sh | sh
```

### Manual Install
1. Download the latest [DribbblishDynamic_vX.X.X.zip](https://github.com/JulienMaille/dribbblish-dynamic-theme/releases/latest)
2. Extract the files to your [Spicetify/Themes folder](https://spicetify.app/docs/development/customization#themes)
3. Copy `dribbblish-dynamic.js` to your [Spicetify/Extensions folder](https://spicetify.app/docs/advanced-usage/extensions#installing)
4. Add the 2 lines in `[Patch]` section of the config file (see details below)
5. Run:
     ```
     spicetify config extensions dribbblish-dynamic.js
     spicetify config current_theme DribbblishDynamic
     spicetify config color_scheme base
     spicetify config inject_css 1 replace_colors 1 overwrite_assets 1
     spicetify apply
     ```

## IMPORTANT!
From Spotify > v1.1.62, in sidebar, they use an adaptive render mechanic to actively show and hide items on scroll. It helps reducing number of items to render, hence there is significant performance boost if you have a large playlists collection. But the drawbacks is that item height is hard-coded, it messes up user interaction when we explicitly change, in CSS, playlist item height bigger than original value. So you need to add these 2 lines in Patch section in config file:
```ini
[Patch]
xpui.js_find_8008 = ,(\w+=)32,
xpui.js_repl_8008 = ,${1}58,
```

## Hide Window Controls
Windows user, please edit your Spotify shortcut and add flag `--transparent-window-controls` after the Spotify.exe:
To edit a taskbar shortcut, right click it, then right click Spotify in the list again.

<img src="https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/main/showcase-images/windows-shortcut-instruction.png" alt="img"> 

In addition to `--transparent-window-controls` you can set `Windows Top Bars` to `Solid` or `Transparent` to look like this:

<img src="https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/main/showcase-images/top-bars.png" alt="img" width="500px"> 

## Follow system dark/light theme (Powershell)
Automatic dark mode should work on MacOs and Linux out of the box.
From Spotify > v1.1.70, dark mode is forced in Windows builds. You will need to patch Spotify.exe using this script:
```powershell
Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/master/patch-dark-mode.ps1" | Invoke-Expression
```

## Uninstall
### Windows (PowerShell)
```powershell
Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/master/uninstall.ps1" | Invoke-Expression
```

### Linux/MacOS (Bash)
```bash
curl -fsSL https://raw.githubusercontent.com/JulienMaille/dribbblish-dynamic-theme/master/uninstall.sh | sh
```

### Manual Uninstall
1. Remove Patch lines you added in config file earlier.
2. Run:
    ```
    spicetify config current_theme " " extensions dribbblish-dynamic.js-
    spicetify apply
    ```
