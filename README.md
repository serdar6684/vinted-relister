# Vinted ReLister

**English | [Français](README.fr.md)**

Chrome extension to quickly relist your items on [vinted.fr](https://www.vinted.fr).

## Installation (from source)

1. Clone this repository
2. `npm install`
3. `npm run build`
4. Open Chrome and go to `chrome://extensions`
5. Enable "Developer mode" (top right)
6. Click "Load unpacked" and select the **repo root** (not `dist/`)
7. Go to your [Vinted dressing](https://www.vinted.fr/member/items/current)

## Usage

1. Go to your [Vinted dressing](https://www.vinted.fr/member/items/current)
2. Click the **✨ Republier** button on any item
3. Update the price if needed (or keep the current price)
4. Confirm
5. Wait for the automatic re-publication to complete

The extension will:

- Re-upload the item's photos
- Create a new item with the same content (and your new price if changed)
- Delete the old item
- Display a notification when done — refresh the page to see the new item at the top

## Status

V1, `vinted.fr` only. The API integration layer (`src/api.js`) is being finalized against real HAR captures of the official Vinted UI flows.

## License

MIT.

## Disclaimer

This extension is not affiliated with or endorsed by Vinted. Use at your own risk. Vinted's Terms of Service may forbid automated interaction with their service; using this extension may result in your account being restricted or banned. Always respect Vinted's Terms of Service.
