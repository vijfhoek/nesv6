#include <stdint.h>
#include "map_data.h"
#include "map.h"
#include "controller.h"
#include "stars.h"

#define PPU_CTRL    (uint8_t *)0x2000
#define PPU_MASK    (uint8_t *)0x2001
#define PPU_STATUS  (uint8_t *)0x2002
#define OAM_ADDRESS (uint8_t *)0x2003
#define OAM_DATA    (uint8_t *)0x2004
#define PPU_SCROLL  (uint8_t *)0x2005
#define PPU_ADDRESS (uint8_t *)0x2006
#define PPU_DATA    (uint8_t *)0x2007

#define SPRITE_DATA (uint8_t *)0x0200

#define PLAYER_HEAD_Y    (SPRITE_DATA + 0)
#define PLAYER_HEAD_TILE (SPRITE_DATA + 1)
#define PLAYER_HEAD_ATTR (SPRITE_DATA + 2)
#define PLAYER_HEAD_X    (SPRITE_DATA + 3)

#define PLAYER_BODY_Y    (SPRITE_DATA + 4)
#define PLAYER_BODY_TILE (SPRITE_DATA + 5)
#define PLAYER_BODY_ATTR (SPRITE_DATA + 6)
#define PLAYER_BODY_X    (SPRITE_DATA + 7)

#define OAM_ATTR_PRIORITY (1 << 5)
#define OAM_ATTR_FLIP_H   (1 << 6)
#define OAM_ATTR_FLIP_V   (1 << 7)


#define PPU_PATTERN_TABLE_0_ADDRESS 0x0000
#define PPU_PATTERN_TABLE_1_ADDRESS 0x1000

#define PPU_NAMETABLE_0_ADDRESS 0x2000
#define PPU_NAMETABLE_1_ADDRESS 0x2400
#define PPU_NAMETABLE_2_ADDRESS 0x2800
#define PPU_NAMETABLE_3_ADDRESS 0x2C00

#define PPU_PALETTE_ADDRESS 0x3F00

#define PLAYER_SAD       0x01
#define PLAYER_FLIPPED_V 0x80
#define PLAYER_FLIPPED_H 0x40
#define PLAYER_FRAME     0x08


#define SET_PALETTE(offset, a, b, c, d) { \
    *PPU_ADDRESS = 0x3F;                  \
    *PPU_ADDRESS = offset;                \
    *PPU_DATA = a;                        \
    *PPU_DATA = b;                        \
    *PPU_DATA = c;                        \
    *PPU_DATA = d;                        \
}

#define SET_PPU_ADDRESS(address) { \
    *PPU_ADDRESS = address >> 8;   \
    *PPU_ADDRESS = address;        \
}

#define CLAMP_MAX(x, max) { if (x > max) x = max; }
#define CLAMP_MIN(x, min) { if (x < min) x = min; }

int8_t  player_vx = 0,    player_vy = 0;
uint8_t player_px = 15*8, player_py = 20*8;
uint8_t player_flags = PLAYER_SAD;

uint8_t map_x = 8, map_y = 5;
uint8_t reload_map = 0;

uint8_t player_flipped = 0;
uint8_t action_pressed = 0;

uint8_t count;
uint8_t nmi_occurred;

extern void wait_vblank(void);

void update_player(const uint8_t c)
{
    // Horizontal movement
    if (c & CONTROLLER_MASK_RIGHT) {
        *PLAYER_HEAD_ATTR &= ~OAM_ATTR_FLIP_H;
        player_vx += 2;
        CLAMP_MAX(player_vx, 10);
    }
    else if (player_vx > 0) {
        player_vx -= 1;
    }

    if (c & CONTROLLER_MASK_LEFT) {
        *PLAYER_HEAD_ATTR |= OAM_ATTR_FLIP_H;

        player_vx -= 1;
        CLAMP_MIN(player_vx, -10);
    }
    else if (player_vx < 0) {
        player_vx += 1;
    }

    player_px += player_vx / 5;

    // Handle map switching when moving off the edges
    if (player_px > 251 && player_vx > 0) {
        map_x += 1;
        reload_map = 1;
        player_px = 0;
    }
    else if (player_px < 2 && player_vx < 0) {
        map_x -= 1;
        reload_map = 1;
        player_px = 255;
    }

    // Handle the flip button
    if (c & CONTROLLER_MASK_ACTION && !action_pressed) {
        player_flipped ^= 1;
        action_pressed = 1;

        *PLAYER_HEAD_ATTR ^= OAM_ATTR_FLIP_V;
        *PLAYER_BODY_ATTR ^= OAM_ATTR_FLIP_V;
    }
    else if (!(c & CONTROLLER_MASK_ACTION) && action_pressed) {
        action_pressed = 0;
    }
    
    // Calculate the x position and the body y position
    *PLAYER_BODY_Y = player_py + (player_flipped ? -1 : 7);
    *PLAYER_HEAD_X = *PLAYER_BODY_X = player_px;
    
    // Set the y position and the body texture for the walking animation
    if (player_vx == 0 || count % 16 < 8) {
        *PLAYER_BODY_TILE = 0x03;
        *PLAYER_HEAD_Y = player_py + (player_flipped ? 7 : -1);
    }
    else if (count % 16 >= 8) {
        *PLAYER_BODY_TILE = 0x04;
        *PLAYER_HEAD_Y = player_py + (player_flipped ? 6 : 0);
    }
}

void initialize(void)
{
    // Load the palettes
    SET_PALETTE(0x10, 0x0F, 0x21, 0x30, 0x00);
    SET_PALETTE(0x14, 0x0F, 0x00, 0x10, 0x30);
    SET_PPU_ADDRESS(0x0000);

    // Initialize the stars
    init_stars();

    *PPU_CTRL = 0x90;
    wait_vblank();

    load_map(MAPS[map_y][map_x]);
}

void main(void)
{
    initialize();

    *PLAYER_HEAD_ATTR = 0x00;
    *PLAYER_BODY_ATTR = 0x00;

    *PLAYER_HEAD_TILE = 0x01;
    *PLAYER_BODY_TILE = 0x03;

    while (1) {
        count += 1;
        update_player(read_controller());
        update_stars();

        if (reload_map) {
            const uint8_t *map = MAPS[map_y][map_x];
            if (map)
                load_map(map);

            reload_map = 0;
            continue;
        }

        wait_vblank();
    }
}
