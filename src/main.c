#include <stdint.h>
#include "map_data.h"
#include "map.h"

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

void main(void)
{
    *PPU_CTRL = 0x00;
    *PPU_MASK = 0x00;

    // *OAM_ADDRESS = 0x00;
    // *OAM_DATA = 0x9F;
    // *OAM_DATA = 0x00;
    // *OAM_DATA = 0x00;
    // *OAM_DATA = 0x20;

    // *OAM_DATA = 0xA7;
    // *OAM_DATA = 0x10;
    // *OAM_DATA = 0x00;
    // *OAM_DATA = 0x20;

    // *PPU_ADDRESS = 0x3F;
    // *PPU_ADDRESS = 0x10;
    // *PPU_DATA = 0x0F;
    // *PPU_DATA = 0x21;
    // *PPU_DATA = 0x30;

    *PPU_CTRL = 0x10;

    load_map(MAP_6_9);

    while (1);
}
