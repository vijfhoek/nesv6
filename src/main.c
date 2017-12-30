#include <stdint.h>
#include "map_data.h"
#include "map.h"
#include "controller.h"

#define PPU_CTRL    (uint8_t *)0x2000
#define PPU_MASK    (uint8_t *)0x2001
#define PPU_STATUS  (uint8_t *)0x2002
#define OAM_ADDRESS (uint8_t *)0x2003
#define OAM_DATA    (uint8_t *)0x2004
#define PPU_SCROLL  (uint8_t *)0x2005
#define PPU_ADDRESS (uint8_t *)0x2006
#define PPU_DATA    (uint8_t *)0x2007

#define PPU_PATTERN_TABLE_0_ADDRESS 0x0000
#define PPU_PATTERN_TABLE_1_ADDRESS 0x1000

#define PPU_NAMETABLE_0_ADDRESS 0x2000
#define PPU_NAMETABLE_1_ADDRESS 0x2400
#define PPU_NAMETABLE_2_ADDRESS 0x2800
#define PPU_NAMETABLE_3_ADDRESS 0x2C00

#define PPU_PALETTE_ADDRESS 0x3F00

#define VSYNC() { while (!(*PPU_STATUS & 0x80)); }

#define PLAYER_SAD       0x01
#define PLAYER_FLIPPED_V 0x02
#define PLAYER_FLIPPED_H 0x04
#define PLAYER_FRAME     0x08


void draw_player(const uint8_t x, const uint8_t y, const uint8_t flags)
{
    // head
    *OAM_ADDRESS = 0x00;
    *OAM_DATA = y - (flags & PLAYER_FRAME ? 0 : 1);
    *OAM_DATA = flags & PLAYER_SAD ? 1 : 0;
    *OAM_DATA = flags & PLAYER_FLIPPED_H ? 1 << 6 : 0;
    *OAM_DATA = x;

    // body
    *OAM_DATA = y + 7;
    *OAM_DATA = flags & PLAYER_FRAME ? 0x11 : 0x10;
    *OAM_DATA = flags & PLAYER_FLIPPED_H ? 1 << 6 : 0;
    *OAM_DATA = x;
}

void main(void)
{
    uint8_t map_x = 8, map_y = 5;
    int8_t player_vx = 0, player_vy = 0;
    uint8_t player_px = 15*8, player_py = 20*8;
    uint8_t flags = PLAYER_SAD;
    uint8_t count;
    const uint8_t *map;

    *PPU_ADDRESS = 0x3F;
    *PPU_ADDRESS = 0x10;
    *PPU_DATA = 0x0F;
    *PPU_DATA = 0x21;
    *PPU_DATA = 0x30;
    *PPU_ADDRESS = 0;
    *PPU_ADDRESS = 0;

    *PPU_CTRL = 0x10;

    load_map(MAPS[map_y][map_x]);

    while (1) {
        uint8_t reload_map = 0;
        const uint8_t c = read_controller();
        count++;

        if (player_vx == 0 || count % 16 == 0)
            flags &= ~PLAYER_FRAME;
        else if (count % 16 == 8)
            flags |= PLAYER_FRAME;

        if (c & CONTROLLER_MASK_RIGHT) {
            flags &= ~PLAYER_FLIPPED_H;
            player_vx += 2;
            if (player_vx > 10)
                player_vx = 10;
        }
        else {
            if (player_vx > 0)
                player_vx -= 1;
        }

        if (c & CONTROLLER_MASK_LEFT) {
            flags |= PLAYER_FLIPPED_H;
            player_vx -= 1;
            if (player_vx < -10)
                player_vx = -10;
        }
        else {
            if (player_vx < 0)
                player_vx += 1;
        }

        player_px += player_vx / 5;

        draw_player(player_px, player_py, flags);

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

        if (reload_map) {
            load_map(MAPS[map_y][map_x]);
            reload_map = 0;
        }

        while (!(*PPU_STATUS & 0x80));
    }
}
