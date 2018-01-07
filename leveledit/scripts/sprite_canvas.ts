export default class {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    vue: any;

    draw() {
        let image = this.context.createImageData(512, 512);
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const sprite = this.vue.sprites[y * 16 + x];
                const color = this.vue.selectedColor < 0 ? 0 : this.vue.selectedColor;
                this.vue.drawSprite(image, x * 8, y * 8, sprite, color, 4);
            }
        }
        this.context.putImageData(image, 0, 0);

        // Draw a rectangle around the selected sprite
        if (this.vue.selectedSprite >= 0) {
            this.context.strokeStyle = '#fff';
            this.context.strokeRect((this.vue.selectedSprite % 16) * 32,
                                    Math.floor(this.vue.selectedSprite / 16) * 32, 
                                    32, 32);
        }
    }

    onMouseMove(event: MouseEvent) {
        this.draw();
        this.context.strokeStyle = '#ddd';

        const pos = this.vue.getMousePos(this.canvas, event, 32);
        this.context.strokeRect(pos.x * 32, pos.y * 32, 32, 32);
    }

    onClick(event: MouseEvent) {
        const pos = this.vue.getMousePos(this.canvas, event, 32);
        this.vue.selectSprite(pos.y * 16 + pos.x);
        this.draw();
    }

    constructor(vue: any) {
        this.vue = vue;
        this.canvas = document.querySelector('.sprite-canvas') as HTMLCanvasElement;
        console.log(this.canvas);

        const context = this.canvas.getContext('2d');
        if (!context)
            throw 'Could not get 2D context';
        this.context = context;

        this.canvas.addEventListener('mousemove', (e: MouseEvent) => this.onMouseMove(e));
        this.canvas.addEventListener('click', (e: MouseEvent) => this.onClick(e));
    }
}
