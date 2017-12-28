.import _main
.import _nmi

.export __STARTUP__:absolute=1

; Linker generated symbols
.import __STACK_START__, __STACKSIZE__
.include "zeropage.inc"
.import initlib, copydata


.segment "ZEROPAGE"



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;              HEADER              ;;;
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


;blank_ram:			;puts zero in all CPU RAM
;  sta $00, x
;  sta $0100, x
;  sta $0200, x
;  sta $0300, x
;  sta $0400, x
;  sta $0500, x
;  sta $0600, x
;  sta $0700, x
;  inx
;  bne blank_ram
;
;@loop:
;  lda $2002
;  bpl @loop


sprites_init:
  jsr blank_sprite
  lda #$00		;pushes all sprites from 200-2ff
  sta $2003		;to the sprite memory
  lda #$02
  sta $4014

  jsr clear_nametable


;;  Turns music channels off
music_init:
  lda #0
  sta $4015

  lda #<(__STACK_START__+__STACKSIZE__)
  sta	sp
  lda	#>(__STACK_START__+__STACKSIZE__)
  sta	sp+1            ; Set the c stack pointer

  jsr	copydata
  jsr	initlib

  lda $2002		;reset the 'latch'
  jmp _main		;jumps to main in c code


_blank_sprite:
blank_sprite:
  ldy #$40
  ldx #$00
  lda #$f8
@loop:		;puts all sprites off screen
  sta $0200, x
  inx
  inx
  inx
  inx
  dey
  bne @loop
  rts


_clear_nametable:
clear_nametable:
  lda $2002
  lda #$20
  sta $2006
  lda #$00
  sta $2006
  lda #$00	;tile 00 is blank
  ldy #$10
  ldx #$00
@blank:		;blanks screen
  sta $2007
  dex
  bne @blank
  dey
  bne @blank
  rts

.export _read_controller
_read_controller:
  lda #$01
  sta $4016
  lda #$00
  sta $4016
  sta $20

  ldx #8
@loop:
  lda $4016
  lsr a
  rol $20

  dex
  bne @loop

  lda $20
  rts

.import popax
;;; _load_map loads a map into the PPU memory
;;;;;
;;; Parameters:
;;;  (SP)[0,1]: The address of the map data
;;;  A:         The length of the map data
.export _load_map
_load_map:
  sta ptr2+1

  ;; Disable background and sprite rendering
  lda #$06
  sta $2001

  ;; Point the PPU to the palette
  lda #$3f
  sta $2006
  lda #$00
  sta $2006

  jsr popax
  sta ptr1
  stx ptr1+1

  ldx ptr2+1

  ;; Copy the palette to the PPU
  ldy #0
@palette_loop:
  lda (ptr1), y
  sta $2007

  iny
  dex

  cmp #$ff
  bne @palette_loop

  stx ptr2+1


  ;; Point the PPU to nametable 0
  lda #$20
  sta $2006
  lda #$00
  sta $2006

@data_loop:
  lda (ptr1), y
  sta $21
  tax

  iny
  lda (ptr1), y
  sta $20

@data_inner:
  sta $2007
  dex
  bne @data_inner
  sta $2007

  jmp @inf

  iny

  ldx ptr2+1
  dex
  dex
  stx ptr2+1

  bne @data_loop

  lda #$00
  sta $2006
  sta $2006
  sta $2005
  sta $2005

  lda #$1e
  sta $2001

@inf:
  jmp @inf

  rts

nmi:
  rti

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
.word start	; $fffc reset
.word irq   ; $fffe irq / brk

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;              CHARS               ;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
.segment "CHARS"

.incbin "tiles.chr"
