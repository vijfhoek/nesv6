.import _main
.import _nmi_occurred

.export __STARTUP__:absolute=1
.import __STACK_START__, __STACKSIZE__

.import initlib, copydata
.include "zeropage.inc"


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;             ZEROPAGE             ;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
.segment "ZEROPAGE"


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;           iNES HEADER            ;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
.segment "HEADER"

.byte $4e,$45,$53,$1a
.byte 01
.byte 01
.byte 00
.byte 00
.res 8,0


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;             STARTUP              ;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
.segment "STARTUP"

tmp_w:
tmp_bl:
    .byte 00
tmp_bh:
    .byte 00

start:
    sei
    cld
    ldx #$40
    stx $4017
    ldx #$ff
    txs
    inx
    stx $2000
    stx $2001
    stx $4010

@loop:
    lda $2002
    bpl @loop
    lda #$00

    ;;  Turns music channels off
    lda #0
    sta $4015

    lda #<(__STACK_START__+__STACKSIZE__)
    sta sp
    lda #>(__STACK_START__+__STACKSIZE__)
    sta sp+1            ; Set the c stack pointer

    jsr copydata
    jsr initlib

    lda $2002            ;reset the 'latch'
    jmp _main            ;jumps to main in c code

.segment "CODE"
nmi:
    lda #$02
    sta $4014

    lda #$01
    sta _nmi_occurred
    rti

irq:
    rti


.export _wait_vblank
_wait_vblank:
    lda _nmi_occurred
    beq _wait_vblank

    lda #0
    sta _nmi_occurred

    rts


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;             RODATA               ;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
.segment "RODATA"


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;             VECTORS              ;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
.segment "VECTORS"

.word nmi    ; $fffa vblank nmi
.word start  ; $fffc reset
.word irq    ; $fffe irq / brk

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;              CHARS               ;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
.segment "CHARS"

.incbin "tiles.chr"
