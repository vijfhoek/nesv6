declare function require(name: string) : any;
let Vue = require('vue');

let colors = require('./palette').colors;

class AppData {
    level: number[][];
    attributes: number[][];

    sprites: number[][];
    palettes: number[];
    attr: number[];

    colors: number[];
    selectedColor: number;
    selectedSprite: number;
    hoverPos: { x: number, y: number };
    mouseDown: boolean;

    cArray: string;
}

var data: AppData = {
    level: [],
    attributes: [],

    sprites: [],
    palettes: [0x0d, 0x00, 0x10, 0x20],
    attr: Array(64).fill(0),

    colors: colors,
    selectedColor: -1,
    selectedSprite: -1,
    hoverPos: { x: -1, y: -1 },
    mouseDown: false,

    cArray: "",
}

const vue = new Vue({
    el: '.app',
    data: data,
    methods: {
        serialize: serialize,
        deserialize: deserialize,

        drawPixel: drawPixel,
        drawSprite: drawSprite,
        drawScreen: drawScreen,
        drawSpriteSheet: drawSpriteSheet,

        selectSprite: selectSprite,
        selectColor: selectColor,

        parseChr: parseChr,
        onChrUpload: onChrUpload,

        initSpriteCanvas: initSpriteCanvas,
        initScreenCanvas: initScreenCanvas,
        clearLevel: clearLevel,

        showColorPicker: showColorPicker,
        onColorPicked: onColorPicked
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
        this.initSpriteCanvas();
        this.initScreenCanvas();

        this.drawSpriteSheet();
        this.drawScreen();

        this.serialize();
    }
});

function selectColor(color: number) {
    this.selectedSprite = -1;
    this.selectedColor = color;

    this.drawSpriteSheet();
}

function selectSprite(spriteId: number) {
    this.selectedSprite = spriteId;
    this.selectedColor = -1;

    this.drawSpriteSheet();
}

function showColorPicker(ev: MouseEvent, color: number, index: number) {
    const picker = document.querySelector('.color-picker') as HTMLDivElement;
    const palette = document.querySelector('.palette') as HTMLDivElement;
    const paletteRect = palette.getBoundingClientRect();
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

    this.drawSpriteSheet();
    this.drawScreen();
}

function getMousePos(canvas: HTMLCanvasElement, ev: MouseEvent, div: number): { x: number, y: number } {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((ev.clientX - rect.left) / div);
    const y = Math.floor((ev.clientY - rect.top) / div);
    return { x: x, y: y };
}

function initSpriteCanvas() {
    const canvas = document.querySelector('.sprite-canvas') as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    if (!context)
        return;

    canvas.addEventListener('mousemove', (ev: MouseEvent) => {
        this.drawSpriteSheet();

        const pos = getMousePos(canvas, ev, 8 * 4);
        context.strokeStyle = '#ddd';
        context.strokeRect(pos.x * 8 * 4, pos.y * 8 * 4, 8 * 4, 8 * 4);
    });

    canvas.addEventListener('click', (ev: MouseEvent) => {
        const pos = getMousePos(canvas, ev, 8 * 4);
        this.selectSprite(pos.y * 16 + pos.x);
        this.drawSpriteSheet();
    })
}

function initScreenCanvas() {
    const canvas = document.querySelector('.screen-canvas') as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    if (!context)
        return;

    canvas.addEventListener('mousedown', (ev: MouseEvent) => { this.mouseDown = true; });
    canvas.addEventListener('mouseup', (ev: MouseEvent) => { this.mouseDown = false; });

    canvas.addEventListener('mousemove', (ev: MouseEvent) => {
        if (this.selectedColor >= 0) {
            this.hoverPos = getMousePos(canvas, ev, 16 * 2);

            // if (this.mouseDown && this.selectedSprite >= 0)
            //     this.level[this.hoverPos.y][this.hoverPos.x] = this.selectedSprite;

            this.drawScreen();

            context.strokeStyle = '#fff';
            context.strokeRect(this.hoverPos.x * 16 * 2, this.hoverPos.y * 16 * 2, 16 * 2, 16 * 2);

            context.beginPath();

            // Horizontal subdivision line
            context.moveTo(this.hoverPos.x * 16 * 2,      this.hoverPos.y * 16 * 2 + 16);
            context.lineTo(this.hoverPos.x * 16 * 2 + 32, this.hoverPos.y * 16 * 2 + 16);

            // Vertical subdivision line
            context.moveTo(this.hoverPos.x * 16 * 2 + 16, this.hoverPos.y * 16 * 2);
            context.lineTo(this.hoverPos.x * 16 * 2 + 16, this.hoverPos.y * 16 * 2 + 32);

            context.setLineDash([2, 2]);
            context.stroke();
            context.setLineDash([]);

            return;
        }

        this.hoverPos = getMousePos(canvas, ev, 8 * 2);

        if (this.mouseDown && this.selectedSprite >= 0)
            this.level[this.hoverPos.y][this.hoverPos.x] = this.selectedSprite;

        this.drawScreen();

        context.strokeStyle = '#fff';
        context.strokeRect(this.hoverPos.x * 8 * 2, this.hoverPos.y * 8 * 2, 8 * 2, 8 * 2);
    });

    canvas.addEventListener('click', (ev: MouseEvent) => {
        const pos = getMousePos(canvas, ev, 8 * 2);

        if (this.selectedSprite >= 0)
            this.level[pos.y][pos.x] = this.selectedSprite;
        this.drawScreen();
    })
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
    for (let tile of flat) {
        if (current == tile && count < 256)
            count++;
        else if (count > 0) {
            result.push(count - 1);
            result.push(current);

            count = 1;
            current = tile;
        }
    }

    if (count > 0) {
        result.push(count - 1);
        result.push(current);
    }

    // Convert the array to C syntax
    //this.cArray = new Uint8Array(result);
    this.cArray = '';
    while (result.length)
        this.cArray += result.splice(0, 15).join(', ') + ',\n'
}


// Parses a C array and loads it as a level
function deserialize() {
    // Parse the array into an array of numbers
    const cleaned: string[] = this.cArray.replace(/{([\s\S]*)};?/gm, '$1').split('\n');
    const noComments: string[] = cleaned.map((a: string) => a.replace(/\/\/.*$/, '').replace(/ /g, ''));
    const numbers: number[] = noComments.join('').split(',').map((x: string) => parseInt(x));

    let i: number = 0;

    // Load the palettes
    this.palettes = [];
    for (i = 0; numbers[i] != 0xFF; i++)
        this.palettes.push(numbers[i]);

    // Decompress the level and attribute data
    let flat: number[] = [];
    for (i += 1; i < numbers.length; i += 2) {
        for (let j = 0; j <= numbers[i]; j++) {
            let val = numbers[i + 1];
            flat.push(val);
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
    console.log(this.attributes);


    // Build a 2D array from the flat array
    this.level = [];
    while (flat.length)
        this.level.push(flat.splice(0, 32));

    localStorage.setItem('attributes', JSON.stringify(this.attributes));
    localStorage.setItem('palettes',   JSON.stringify(this.palettes));
    localStorage.setItem('level',      JSON.stringify(this.level));

    this.drawSpriteSheet();
    this.drawScreen();
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

// Draws the loaded screen into .screen-canvas
function drawScreen() {
    let canvas = <HTMLCanvasElement>document.querySelector('.screen-canvas');
    let context = canvas.getContext('2d');
    if (context == null) {
        alert('Could not get 2D context for screen canvas');
        return;
    }

    let image = context.createImageData(512, 480);
    const hover_x = this.hoverPos.x;
    const hover_y = this.hoverPos.y;

    for (let y = 0; y < 30; y++) {
        for (let x = 0; x < 32; x++) {
            const val = this.level[y][x];
            const sprite = this.sprites[val];

            let attr = this.attributes[y >> 1][x >> 1];

            if (this.selectedColor >= 0 && x >> 1 == hover_x && y >> 1 == hover_y)
                attr = this.selectedColor;

            this.drawSprite(image, x * 8, y * 8, sprite, attr, 2);
        }
    }

    if (this.selectedSprite >= 0) {
        if (hover_x >= 0 && hover_y >= 0) {
            let attr = this.attributes[hover_y >> 1][hover_x >> 1];
            let sprite = this.sprites[this.selectedSprite];
            this.drawSprite(image, hover_x * 8, hover_y * 8, sprite, attr, 2);
        }
    }

    context.putImageData(image, 0, 0);
}

// Draws the spritesheet into .sprite-canvas
function drawSpriteSheet() {
    let canvas = document.querySelector('.sprite-canvas') as HTMLCanvasElement;
    let context = canvas.getContext('2d');
    if (context == null) {
        alert('Could not get 2D context for sprite canvas');
        return;
    }

    let image = context.createImageData(512, 512);
    for (let i = 0; i < 256; i++) {
        const sprite = this.sprites[i];

        const x_pos = i % 16;
        const y_pos = Math.floor(i / 16);

        const color = this.selectedColor < 0 ? 0 : this.selectedColor;
        this.drawSprite(image, x_pos * 8, y_pos * 8, sprite, color, 4);
    }

    context.putImageData(image, 0, 0);

    if (this.selectedSprite < 0)
        return;

    context.strokeStyle = '#fff';
    context.strokeRect((this.selectedSprite % 16) * 8 * 4,
                       Math.floor(this.selectedSprite / 16) * 8 * 4,
                       8 * 4, 8 * 4);
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

    this.drawSpriteSheet();
    this.drawScreen();
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
    if (confirm('Are you sure you want to clear the level?')) {
        this.level = createEmpty();

        this.attributes = [];
        for (let i = 0; i < 15; i++)
            this.attributes.push(Array(16).fill(0))

        this.drawScreen();
        this.serialize();
    }
}
