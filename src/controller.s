.include "zeropage.inc"

.export _read_controller
_read_controller:
    lda #$01
    sta $4016
    lda #$00
    sta $4016
    sta ptr1

    ldx #8
@loop:
    lda $4016
    lsr a
    rol ptr1

    dex
    bne @loop

    lda ptr1
    rts