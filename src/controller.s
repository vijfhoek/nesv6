.include "zeropage.inc"
.include "util.inc"

.export _read_controller
_read_controller:
    stm CONTROLLER_1, #1
    stm CONTROLLER_1, #0
    stm ptr1, #$00

.repeat 8
    lda CONTROLLER_1  ; Read the controller output
    lsr a             ; Shift the bit into carry
    rol ptr1          ; Rotate the carry into ptr1
.endrepeat

    lda ptr1
    rts
