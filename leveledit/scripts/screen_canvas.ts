export default class {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    vue: any;

    mouseDown: boolean                  = false;
    hoverPos:  { x: number, y: number } = { x: 0, y: 0 };

    draw() {
        let image = this.context.createImageData(512, 480);
        const hover_x = this.hoverPos.x;
        const hover_y = this.hoverPos.y;

        for (let y = 0; y < 30; y++) {
            for (let x = 0; x < 32; x++) {
                const val = this.vue.level[y][x];
                const sprite = this.vue.sprites[val];

                let attr = this.vue.attributes[y >> 1][x >> 1];

                if (this.vue.selectedColor >= 0 && x >> 1 == hover_x && y >> 1 == hover_y)
                    attr = this.vue.selectedColor;

                this.vue.drawSprite(image, x * 8, y * 8, sprite, attr, 2);
            }
        }

        if (this.vue.selectedSprite >= 0) {
            if (hover_x >= 0 && hover_y >= 0) {
                let attr = this.vue.attributes[hover_y >> 1][hover_x >> 1];
                let sprite = this.vue.sprites[this.vue.selectedSprite];
                this.vue.drawSprite(image, hover_x * 8, hover_y * 8, sprite, attr, 2);
            }
        }

        this.context.putImageData(image, 0, 0);
    }

    onMouseMoveColor(event: MouseEvent) {
        this.hoverPos = this.vue.getMousePos(this.canvas, event, 16 * 2);

        this.draw();

        this.context.strokeStyle = '#fff';
        this.context.strokeRect(this.hoverPos.x * 16 * 2, this.hoverPos.y * 16 * 2, 16 * 2, 16 * 2);

        this.context.beginPath();

        // Horizontal subdivision line
        this.context.moveTo(this.hoverPos.x * 16 * 2,      this.hoverPos.y * 16 * 2 + 16);
        this.context.lineTo(this.hoverPos.x * 16 * 2 + 32, this.hoverPos.y * 16 * 2 + 16);

        // Vertical subdivision line
        this.context.moveTo(this.hoverPos.x * 16 * 2 + 16, this.hoverPos.y * 16 * 2);
        this.context.lineTo(this.hoverPos.x * 16 * 2 + 16, this.hoverPos.y * 16 * 2 + 32);

        this.context.setLineDash([2, 2]);
        this.context.stroke();
        this.context.setLineDash([]);
    }

    onMouseMoveSprite(event: MouseEvent) {
        this.hoverPos = this.vue.getMousePos(this.canvas, event, 8 * 2);

        if (this.mouseDown && this.vue.selectedSprite >= 0) {
            this.vue.level[this.hoverPos.y][this.hoverPos.x] = this.vue.selectedSprite;
            this.vue.serialize();
        }

        this.draw();

        this.context.strokeStyle = '#fff';
        this.context.strokeRect(this.hoverPos.x * 8 * 2, this.hoverPos.y * 8 * 2, 8 * 2, 8 * 2);
    }

    onMouseMove(event: MouseEvent) {
        if (this.vue.selectedColor >= 0)
            this.onMouseMoveColor(event);
        else
            this.onMouseMoveSprite(event);
    }

    constructor(vue: any) {
        this.vue = vue;
        this.canvas = document.querySelector('.screen-canvas') as HTMLCanvasElement;

        const context = this.canvas.getContext('2d');
        if (!context)
            throw 'Could not get 2D context';
        this.context = context;

        this.canvas.addEventListener('mousedown', () => { this.mouseDown = true; });
        this.canvas.addEventListener('mouseup', () => { this.mouseDown = false; });

        this.canvas.addEventListener('mousemove', (e: MouseEvent) => { this.onMouseMove(e) });

        this.canvas.addEventListener('click', (ev: MouseEvent) => {
            const pos = this.vue.getMousePos(this.canvas, ev, 8 * 2);

            if (vue.selectedSprite >= 0) {
                vue.level[pos.y][pos.x] = this.vue.selectedSprite;
                vue.serialize();
            }
            this.draw();
        });

        this.canvas.addEventListener('contextmenu', (ev: MouseEvent) => {
            ev.preventDefault();
            if (vue.selectedSprite < 0)
                return;

            const clickPos = this.vue.getMousePos(this.canvas, ev, 8 * 2);
            const origSprite = vue.level[clickPos.y][clickPos.x];
            if (origSprite == vue.selectedSprite)
                return;

            let stack: { x: number, y: number }[] = [clickPos];
            while (true) {
                const pos = stack.pop();
                if (!pos) break;

                if (vue.level[pos.y][pos.x] != origSprite)
                    continue;

               vue.level[pos.y][pos.x] = vue.selectedSprite;
                for (let y of [-1, 0, 1]) {
                    const newY = y + pos.y;
                    if (newY < 0 || newY >= 30)
                        continue;

                    for (let x of [-1, 0, 1]) {
                        const newX = x + pos.x;
                        if (newX < 0 || newX >= 32 || vue.level[newY][newX] != origSprite)
                            continue;

                        stack.push({ x: newX, y: newY });
                    }
                }
            }

            vue.serialize();
            this.draw();
        });
    }
}