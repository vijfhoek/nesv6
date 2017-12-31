declare function require(name: string) : any;
let Vue = require('vue');

import SpriteCanvas from './sprite_canvas';
import ScreenCanvas from './screen_canvas';

let colors = require('./palette').colors;

class AppData {
    level:      number[][];
    attributes: number[][];

    sprites:  number[][];
    palettes: number[];
    attr:     number[];

    colors:         number[];
    selectedColor:  number;
    selectedSprite: number;
    hoverPos:       { x: number, y: number };
    mouseDown:      boolean;

    cArray: string;
    size:   number;

    screenCanvas: ScreenCanvas | null;
    spriteCanvas: SpriteCanvas | null;
}

var data: AppData = {
    level:      [],
    attributes: [],

    sprites:  [],
    palettes: [0x0d, 0x00, 0x10, 0x20],
    attr:     Array(64).fill(0),

    colors:         colors,
    selectedColor:  -1,
    selectedSprite: -1,
    hoverPos:       { x: -1, y: -1 },
    mouseDown:      false,

    cArray: "",
    size:   0,

    spriteCanvas: null,
    screenCanvas: null
}

const vue = new Vue({
    el: '.app',
    data: data,
    methods: {
        serialize:   serialize,
        deserialize: deserialize,

        drawPixel:       drawPixel,
        drawSprite:      drawSprite,

        getMousePos:  getMousePos,
        selectSprite: selectSprite,
        selectColor:  selectColor,

        parseChr:    parseChr,
        onChrUpload: onChrUpload,

        clearLevel:       clearLevel,

        showColorPicker: showColorPicker,
        onColorPicked:   onColorPicked
    },
    created: function() {
        let levelJson = localStorage.getItem('level');
        this.level = levelJson ? JSON.parse(levelJson) : createEmpty();

        let sprites = localStorage.getItem('sprites');
        this.sprites = sprites ? JSON.parse(sprites) : [];

        let palettes = localStorage.getItem('palettes');
        this.palettes = palettes ? JSON.parse(palettes) : [];

        let attributes = localStorage.getItem('attributes');
        this.attributes = attributes ? JSON.parse(attributes) : [];
    },
    mounted: function() {
        this.spriteCanvas = new SpriteCanvas(this);
        this.screenCanvas = new ScreenCanvas(this);

        this.spriteCanvas.draw();
        this.screenCanvas.draw();

        this.serialize();
    }
});

function selectColor(color: number) {
    this.selectedSprite = -1;
    this.selectedColor = color;

    this.spriteCanvas.draw();
}

function selectSprite(spriteId: number) {
    this.selectedSprite = spriteId;
    this.selectedColor = -1;

    this.spriteCanvas.draw();
}

function showColorPicker(ev: MouseEvent, color: number, index: number) {
    const palette     = document.querySelector('.palette') as HTMLDivElement;
    const paletteRect = palette.getBoundingClientRect();

    const picker = document.querySelector('.color-picker') as HTMLDivElement;
    picker.style.left = ev.clientX - paletteRect.left + 'px';
    picker.style.top = ev.clientY - paletteRect.top + 'px';
    picker.style.display = 'block';

    picker.querySelectorAll("div").forEach(d => d.removeAttribute('data-selected'));
    const div = picker.querySelector("div[data-color='" + color + "']");
    div && div.setAttribute('data-selected', '');

    picker.setAttribute('data-index', index.toString());

    ev.preventDefault();
}

function onColorPicked(selection: number) {
    const picker = document.querySelector('.color-picker') as HTMLDivElement;
    picker.style.display = 'none';

    const indexStr = picker.getAttribute('data-index');
    if (indexStr == null)
        return;

    const index = parseInt(indexStr);
    Vue.set(this.palettes, index, selection);

    this.spriteCanvas.draw();
    this.screenCanvas.draw();
    this.serialize();
}

function getMousePos(canvas: HTMLCanvasElement, ev: MouseEvent, div: number): { x: number, y: number } {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((ev.clientX - rect.left) / div);
    const y = Math.floor((ev.clientY - rect.top) / div);
    return { x: x, y: y };
}



// Creates an empty level array
function createEmpty(): number[][] {
    const level: number[][] = [];
    for (let y = 0; y < 30; y++) {
        const row: number[] = [];
        for (let x = 0; x < 32; x++)
            row.push(0);

        level.push(row);
    }
    return level;
}


// Creates a C array from the loaded level
function serialize() {
    // Re-tangle the attributes
    let attr: number[] = [];
    for (let y = 0; y < 15; y += 2) {
        for (let x = 0; x < 16; x += 2) {
            let value = (this.attributes[y][x] << 0) | (this.attributes[y][x + 1] << 2);
            if (y < 14)
                value |= (this.attributes[y + 1][x] << 4) | (this.attributes[y + 1][x + 1] << 6);

            attr.push(value);
        }
    }

    let flat: number[] = [].concat(...this.level);
    flat = flat.concat(attr);

    let current = flat[0];
    let count = 0;

    let result = this.palettes.concat(0xFF);

    // Compress the level data
    let compressed: number[] = []
    for (let tile of flat) {
        if (current == tile && count < 256)
            count++;
        else if (count > 0) {
            compressed.push(count % 256);
            compressed.push(current);

            count = 1;
            current = tile;
        }
    }

    if (count > 0) {
        compressed.push(count % 256);
        compressed.push(current);
    }

    // Join everything together
    while (compressed.length) {
        let slice = compressed.splice(0, 254);
        result = result.concat(slice.length, slice);
    }
    result.push(0);

    // Convert the array to C syntax
    this.cArray = '';
    this.size = result.length;
    while (result.length)
        this.cArray += result.splice(0, 15).join(', ') + ',\n'
}


// Parses a C array and loads it as a level
function deserialize() {
    // Parse the array into an array of numbers
    const cleaned: string[] = this.cArray.replace(/{([\s\S]*)};?/gm, '$1').split('\n');
    const noComments: string[] = cleaned.map((a: string) => a.replace(/\/\/.*$/, '').replace(/ /g, ''));
    const numbers: number[] = noComments.join('').split(',').map((x: string) => parseInt(x));

    // Load the palettes
    let i: number;
    this.palettes = [];
    for (i = 0; numbers[i] != 0xFF; i++)
        this.palettes.push(numbers[i]);
    numbers.splice(0, i + 1);

    // Decompress the level and attribute data
    let flat: number[] = [];
    while (numbers) {
        const length = numbers.splice(0, 1)[0];
        if (length == 0)
            break;

        const block = numbers.splice(0, length);
        for (let i = 0; i < block.length; i += 2) {
            for (let j = 0; j < (block[i] == 0 ? 256 : block[i]); j++) {
                flat.push(block[i + 1]);
            }
        }
    }

    // Unravel the attributes
    let attrs = flat.splice(30 * 32);

    this.attributes = [];
    for (let y = 0; y < 30; y += 2) {
        let row: number[] = []
        for (let x = 0; x < 32; x += 2) {
            const attr_i = (y >> 2) * 8 + (x >> 2);
            const attr_b = ((y >> 1) % 2 ? 4 : 0) + ((x >> 1) % 2 ? 2 : 0);
            row.push((attrs[attr_i] >> attr_b) & 3)
        }

        this.attributes.push(row);
    }

    // Build a 2D array from the flat array
    this.level = [];
    while (flat.length)
        this.level.push(flat.splice(0, 32));

    localStorage.setItem('attributes', JSON.stringify(this.attributes));
    localStorage.setItem('palettes',   JSON.stringify(this.palettes));
    localStorage.setItem('level',      JSON.stringify(this.level));

    this.spriteCanvas.draw();
    this.screenCanvas.draw();
}

// Draw a pixel at (x, y) with scale scale
function drawPixel(image: ImageData, x: number, y: number, val: number, scale: number) {
    for (let yy: number = y * scale; yy < y * scale + scale; yy++) {
        for (let xx: number = x * scale; xx < x * scale + scale; xx++) {
            const pixelIndex = (yy * 512 + xx) * 4;
            image.data[pixelIndex]     = colors[val * 4];
            image.data[pixelIndex + 1] = colors[val * 4 + 1];
            image.data[pixelIndex + 2] = colors[val * 4 + 2];
            image.data[pixelIndex + 3] = 255;
        }
    }
}

// Draw a sprite on an ImageData object with scale scale
function drawSprite(image: ImageData, x_pos: number, y_pos: number, sprite: number[][], attr: number, scale: number) {
    for (let x: number = 0; x < 8; x++) {
        for (let y: number = 0; y < 8; y++) {
            const val = this.palettes[attr * 4 + sprite[y][x]];
            this.drawPixel(image, x_pos + x, y_pos + y, val, scale);
        }
    }
}

// Parses a chr file and loads its sprites into this.sprites
function parseChr(content: ArrayBuffer) {
    this.sprites = [];

    for (let i = 0; i < 256; i++) {
        // Get an Uint8Array of the sprite data
        let slice = content.slice(i * 0x10 + 0x1000, i * 0x10 + 0x1010);
        let sprite = new Uint8Array(slice);

        let pattern = [];
        for (let y = 0; y < 8; y++) {
            let row = [];
            for (let x = 0; x < 8; x++) {
                // Calculate the pixel value
                const h = (sprite[y + 8] >> (7 - x)) & 1;
                const l = (sprite[y] >> (7 - x)) & 1;
                const val = h * 2 + l;

                row.push(val);
            }
            pattern.push(row);
        }

        this.sprites.push(pattern);
    }

    localStorage.setItem('sprites', JSON.stringify(this.sprites));

    this.spriteCanvas.draw();
    this.screenCanvas.draw();
}

// Handles someone uploading a .chr file
function onChrUpload(e: UIEvent) {
    let target = <HTMLInputElement>e.target;
    if (!target.files || target.files.length == 0)
        return;

    let reader = new FileReader();
    reader.onload = (ev: Event) => {
        var content = (ev.target as FileReader).result;
        this.parseChr(content);
    };

    reader.readAsArrayBuffer(target.files[0]);
}

function clearLevel() {
    if (!confirm('Are you sure you want to clear the level?')) {
        return;
    }

    this.level = createEmpty();

    this.attributes = [];
    for (let i = 0; i < 15; i++)
        this.attributes.push(Array(16).fill(0))

    this.drawScreen();
    this.serialize();
}
