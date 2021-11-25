import { waitForElement, htmlToNode } from "./Util";

import iconFolder from "icon/folder.light";
import iconFolderOpen from "icon/folder-open.light";
import iconNote from "icon/note";

waitForElement([`.main-rootlist-rootlistPlaylistsScrollNode ul[tabindex="0"]`, `.main-rootlist-rootlistPlaylistsScrollNode ul[tabindex="0"] li`], ([root, firstItem]) => {
    const listElem = firstItem.parentElement;
    root.classList.add("dribs-playlist-list");

    /** Replace Playlist name with their pictures */
    async function loadPlaylistImage() {
        for (const item of listElem.children) {
            let link = item.querySelector("a");
            if (!link) continue;

            let [_, app, uid] = link.pathname.split("/");

            if (link.querySelector("svg")) link.querySelector("svg").remove();
            if (link.querySelector("img")) link.querySelector("img").remove();
            const title = link.querySelector("span").innerText;
            let elem;

            if (app === "playlist") {
                const {
                    metadata: { picture }
                } = await Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${Spicetify.URI.playlistV2URI(uid).toURI()}/metadata`, { policy: { picture: true } });

                if (picture != null && picture.trim() != "") {
                    if (!link.querySelector("img")) elem = document.createElement("img");
                    elem.src = picture;
                } else {
                    if (!link.querySelector("svg")) elem = htmlToNode(iconNote.replace(/<\/svg>/, `<title>${title}</title>$1`));
                }
            } else if (app === "folder") {
                const base64 = localStorage.getItem("dribbblish:folder-image:" + uid);
                if (base64 != null) {
                    if (!link.querySelector("img")) elem = document.createElement("img");
                    elem.src = base64;
                } else {
                    if (!link.querySelector("svg")) elem = htmlToNode(iconFolder.replace(/<\/svg>/, `<title>${title}</title>$1`));
                }
            } else {
                continue;
            }

            elem.title = title;
            elem.classList.add("playlist-picture");
            link.prepend(elem);
        }
    }
    loadPlaylistImage();
    new MutationObserver(loadPlaylistImage).observe(listElem, { childList: true });

    const filePickerForm = document.createElement("form");
    filePickerForm.setAttribute("aria-hidden", true);
    filePickerForm.innerHTML = '<input type="file" class="hidden-visually" />';
    document.body.appendChild(filePickerForm);
    /** @type {HTMLInputElement} */
    const filePickerInput = filePickerForm.childNodes[0];
    filePickerInput.accept = ["image/jpeg", "image/apng", "image/avif", "image/gif", "image/png", "image/svg+xml", "image/webp"].join(",");

    filePickerInput.onchange = () => {
        if (!filePickerInput.files.length) return;

        const file = filePickerInput.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target.result;
            const id = Spicetify.URI.from(filePickerInput.uri).id;
            try {
                localStorage.setItem("dribbblish:folder-image:" + id, result);
            } catch {
                Spicetify.showNotification("File too large");
            }
            loadPlaylistImage();
        };
        reader.readAsDataURL(file);
    };

    new Spicetify.ContextMenu.Item(
        "Remove folder image",
        ([uri]) => {
            const id = Spicetify.URI.from(uri).id;
            localStorage.removeItem("dribbblish:folder-image:" + id);
            loadPlaylistImage();
        },
        ([uri]) => Spicetify.URI.isFolder(uri),
        "x"
    ).register();
    new Spicetify.ContextMenu.Item(
        "Choose folder image",
        ([uri]) => {
            filePickerInput.uri = uri;
            filePickerForm.reset();
            filePickerInput.click();
        },
        ([uri]) => Spicetify.URI.isFolder(uri),
        "edit"
    ).register();
});
