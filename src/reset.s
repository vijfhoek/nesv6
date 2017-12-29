.import _main
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


nmi:
irq:
    rti

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;             RODATA               ;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
.segment "RODATA"

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;             VECTORS              ;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
.segment "VECTORS"

.word nmi   ; $fffa vblank nmi
.word start      ; $fffc reset
.word irq   ; $fffe irq / brk

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;              CHARS               ;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
.segment "CHARS"

.incbin "tiles.chr"
