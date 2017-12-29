.include "zeropage.inc"
.import popax

.define PPUSTATUS $2002
.define PPUSCROLL $2005
.define PPUADDR   $2006
.define PPUDATA   $2007

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
    lda #$06
    sta $2001

    ;; Point the PPU to the palette
    lda #$3f
    sta PPUADDR
    lda #$00
    sta PPUADDR

    ;; Copy the palette to the PPU
    ldy #0
    @palette_loop:
        lda (ptr1), y
        sta PPUDATA
        iny

        cmp #$ff
        bne @palette_loop

    ;; Point the PPU to nametable 0
    lda #$20
    sta PPUADDR
    lda #$00
    sta PPUADDR

    @block_loop:
        ;; Add Y to the pointer to prevent an overflow
        sty ptr2

        clc
        ;; Add Y to the low byte
        lda ptr1
        adc ptr2
        sta ptr1
        ;; Add the carry to the high byte
        lda ptr1+1
        adc #0
        sta ptr1+1

        ldy #0

        lda (ptr1), y

        ;; Exit when the block length is 0
        beq @reset_ppu_regs

        sta ptr2
        iny

        @data_loop:
            lda (ptr1), y   
            tax              
            iny               
                            
            lda (ptr1), y       
            iny        
                
            @data_inner_loop:
                sta PPUDATA         
                dex                  
                bne @data_inner_loop 

            ldx ptr2 
            dex     
            dex     
            stx ptr2
            
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
    lda #$1e
    sta $2001

    rts
