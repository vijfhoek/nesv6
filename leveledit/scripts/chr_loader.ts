export default class {
    vue: any;

    constructor(vue: any) {
        this.vue = vue;
    }

    // Parses a chr file and loads its sprites into this.sprites
    parseChr(content: ArrayBuffer) {
        this.vue.sprites = [];

        for (let i = 0; i < 256; i++) {
            // Get an Uint8Array of the sprite data
            let slice = content.slice(i * 0x10 + 0x1000, i * 0x10 + 0x1010);
            let sprite = new Uint8Array(slice);

            let pattern = [];
            for (let y = 0; y < 8; y++) {
                let row = [];
                for (let x = 0; x < 8; x++) {
                    // Calculate the pixel value
                    const high = (sprite[y + 8] >> (7 - x)) & 1;
                    const low  = (sprite[y]     >> (7 - x)) & 1;
                    row.push(high * 2 + low);
                }
                pattern.push(row);
            }

            this.vue.sprites.push(pattern);
        }

        localStorage.setItem('sprites', JSON.stringify(this.vue.sprites));

        this.vue.spriteCanvas.draw();
        this.vue.screenCanvas.draw();
    }

    // Handles someone uploading a .chr file
    onChrUpload(e: UIEvent) {
        let target = e.target as HTMLInputElement;
        if (!target.files || target.files.length == 0)
            return;

        let reader = new FileReader();
        reader.onload = (ev: Event) => {
            var content = (ev.target as FileReader).result;
            this.parseChr(content);
        };

        reader.readAsArrayBuffer(target.files[0]);
    }
}