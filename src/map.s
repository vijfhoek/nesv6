.include "zeropage.inc"
.import popax

.define PPUMASK   $2001
.define PPUSTATUS $2002
.define PPUSCROLL $2005
.define PPUADDR   $2006
.define PPUDATA   $2007

;;; Add a byte to a word
;;; Destroys A
.macro addwb word, byte
    clc
    ;; Add Y to the low byte
    lda word
    adc byte
    sta word
    ;; Add the carry to the high byte
    lda word+1
    adc #0
    sta word+1
.endmacro

.macro stm addr, val
    lda val
    sta addr
.endmacro

.macro stppuaddr val
    stm PPUADDR, #>(val)
    stm PPUADDR, #<(val)
.endmacro


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
    stppuaddr $3f00

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
    stppuaddr $2000

    @block_loop:
        ;; Add Y to the pointer to prevent an overflow
        sty ptr2
        addwb ptr1, ptr2
        ldy #0

        ;; Exit when the block length is 0
        lda (ptr1), y
        beq @reset_ppu_regs

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

@reset_ppu_regs:
    lda #$00
    sta PPUADDR
    sta PPUADDR
    sta PPUSCROLL
    sta PPUSCROLL

@vblank_wait:
    ;; Wait for vblank to reactivate drawing
    lda PPUSTATUS
    and #$80
    beq @vblank_wait

    ;; Reactivate bg/sprite drawing
    stm PPUMASK, #$1e

    rts
