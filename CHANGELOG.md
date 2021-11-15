Added:
- `Report Bugs` and `Changelog` buttons to `Settings > About`
- Markdown parsing for settings descriptions
- Option to have a button to open the settings next to your profile picture

Fixed:
- Fonts looking blurry
- Notification popups are being invisible when the (dribbblish) settings are open
- Missing on/off times settings for `Based on Time` dark mode (#107)
- Playing icon position being wrong when listening to a playlist that is inside a folder ([#106 (comment)](https://github.com/JulienMaille/dribbblish-dynamic-theme/issues/106#issuecomment-967208507))

Improved:
- The settings UI now better represents grouped items
- Settings that have been changed from default will now show a line next to them. Inspired by the [Visual Studio Code settings UI](https://d33wubrfki0l68.cloudfront.net/d1f1ea4def506997ced23d3d912154794e530e1c/063d2/assets/img/blog/2020-09-17-vscode-settings/settings-ui.png)
- Checkbox / Switch input styles are now more in line with other input styles
- Available updates are now shown as a clickable button next to your user icon instead of having to open the user menu
- The "offline" icon is now handled by dribbblish and fits in with the other info icons
- Hovering over the release date in the album info now shows the full date