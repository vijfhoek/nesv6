;;; Controller constants
.define CONTROLLER_1 $4016
.define CONTROLLER_2 $4017

;;; PPU constants
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

.macro setppuaddr val
    stm PPUADDR, #>(val)
    stm PPUADDR, #<(val)
.endmacro
