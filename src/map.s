.include "zeropage.inc"
.include "util.inc"

.import _collision_map

.import _wait_vblank

;;; _load_map loads a map into the PPU memory
;;; Cycles:
;;;
;;; Parameters:
;;;  AX: The address of the map data
.export _load_map
_load_map:
    sta ptr1
    stx ptr1+1

    ;; Disable background and sprite rendering
    stm PPUMASK, #$06

    ;; Point the PPU to the palette
    setppuaddr $3f00

    ;; Copy the palette to the PPU
    ldy #$00
    @palette_loop:
        lda (ptr1), y

        cmp #$ff
        beq @palette_loop_end

        sta PPUDATA
        iny

        jmp @palette_loop
    @palette_loop_end:

    iny

    ;; Point the PPU to nametable 0
    setppuaddr $2000

    @block_loop:
        ;; Add Y to the pointer to prevent an overflow
        sty ptr2
        addwb ptr1, ptr2
        ldy #0

        ;; Exit when the block length is 0
        lda (ptr1), y
        beq @block_loop_end

        sta ptr2
        iny

        @data_loop:
            lda (ptr1), y
            iny
            tax

            lda (ptr1), y
            iny

            ;; Store the value to PPUDATA x times
            @data_inner_loop:
                sta PPUDATA
                dex
                bne @data_inner_loop

            dec ptr2
            dec ptr2
            bne @data_loop

        jmp @block_loop
    @block_loop_end:

    ldy #120
    @collision_map_loop:
        lda (ptr1), y
        sta _collision_map-1, y
        dey
        bne @collision_map_loop

@reset_ppu_regs:
    lda #$00
    sta PPUADDR
    sta PPUADDR
    sta PPUSCROLL
    sta PPUSCROLL

    ;; Wait for vblank to avoid artifacts
    jsr _wait_vblank

    ;; Reactivate bg/sprite drawing
    stm PPUMASK, #$1e

    rts
