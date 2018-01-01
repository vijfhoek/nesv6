.import _rand

.segment "CODE"

.export _init_stars
_init_stars:
    ldy #$44

@loop:
    ;; Randomize the x coordinate
    jsr _rand
    sta $20f, y
    dey

    ;; Behind the background and palette 4+1
    lda #$21
    sta $20f, y
    dey

    ;; Pick randomly between a far and a close star
    jsr _rand
    and #1
    clc
    adc #5
    sta $20f, y
    dey

    ;; Randomize the y coordinate between 0 and 216
@y_loop:
    jsr _rand
    cmp #216
    bcs @y_loop  ; regenerate if y >= 216
    sta $20f, y
    dey

    bne @loop
    rts


.export _update_stars
_update_stars:
    ldy #$40
@loop:
    lda $0211, y

    ;; Calculate the speed
    sec
    sbc #4
    asl a

    ;; Negate (so they move left)
    eor #$ff
    sec

    ;; Add the speed to the x coordinate
    adc $0213, y
    sta $0213, y

.repeat 4
    dey
.endrepeat
    bcs @loop

    rts
