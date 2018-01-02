#include <stdint.h>
#include "map_data.h"
#include "map.h"
#include "controller.h"
#include "stars.h"
#include "player.h"

#define PPU_CTRL    (uint8_t *)0x2000
#define PPU_MASK    (uint8_t *)0x2001
#define PPU_STATUS  (uint8_t *)0x2002
#define OAM_ADDRESS (uint8_t *)0x2003
#define OAM_DATA    (uint8_t *)0x2004
#define PPU_SCROLL  (uint8_t *)0x2005
#define PPU_ADDRESS (uint8_t *)0x2006
#define PPU_DATA    (uint8_t *)0x2007

#define SPRITE_DATA (uint8_t *)0x0200

#define PPU_PATTERN_TABLE_0_ADDRESS 0x0000
#define PPU_PATTERN_TABLE_1_ADDRESS 0x1000

#define PPU_NAMETABLE_0_ADDRESS 0x2000
#define PPU_NAMETABLE_1_ADDRESS 0x2400
#define PPU_NAMETABLE_2_ADDRESS 0x2800
#define PPU_NAMETABLE_3_ADDRESS 0x2C00

#define PPU_PALETTE_ADDRESS 0x3F00

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


uint8_t map_x = 7, map_y = 3;
uint8_t reload_map = 0;

uint8_t count;
uint8_t nmi_occurred;

uint8_t collision_map[120];


extern void wait_vblank(void);


void initialize(void)
{
    // Load the palettes
    SET_PALETTE(0x10, 0x0F, 0x21, 0x30, 0x00);
    SET_PALETTE(0x14, 0x0F, 0x00, 0x10, 0x30);
    SET_PPU_ADDRESS(0x0000);

    init_stars();
    init_player();

    *PPU_CTRL = 0x90;
    wait_vblank();

    load_map(MAPS[map_y][map_x]);
}

void loop(void)
{
    count += 1;
    update_player(read_controller());
    update_stars();

    if (reload_map) {
        const uint8_t *map = MAPS[map_y][map_x];
        if (map)
            load_map(map);

        reload_map = 0;
        return;
    }

    wait_vblank();
}

void main(void)
{
    initialize();
    while (1)
        loop();
}
