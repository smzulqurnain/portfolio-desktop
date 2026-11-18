# Editing the site

All content lives in two files. The page reads them when it loads.

- `content/projects.json`: every project window (title, client, folder, thumbnail, and the post content blocks)
- `content/site.json`: your name, handle, role, about text, showreel and social links

## With the control panel (Pages CMS)

1. Go to https://app.pagescms.org and sign in with GitHub.
2. Pick this repository. The first time, GitHub asks you to install the Pages CMS app on it. Allow it for this repo only.
3. **Projects**: click **Add an entry**, fill in the form, upload a thumbnail, then **Save**.
   - Drag entries to reorder. The top one shows first.
   - **Post content** is the body of the project window, block by block: Text, Image, Image row or Video. Drag blocks to reorder.
   - A leading Image block becomes the big picture at the top of the window.
   - Video blocks take a Vimeo, YouTube or Behance/Adobe embed link. Set the shape (wide, square, portrait, tall) so vertical cuts aren't letterboxed.
4. **Site text & links**: edit the bio, showreel and socials.

Each save is a commit to GitHub. GitHub Pages republishes the site in about a minute.

## Without it

On github.com, open `content/projects.json`, click the pencil icon, copy an existing `{ ... }` block, and edit it. Mind the commas between blocks. Upload the thumbnail to `assets/thumbs/` with **Add file → Upload files**.

## Preview locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765. Opening `index.html` straight from Finder won't work, because browsers block loading the content files from `file://`.
