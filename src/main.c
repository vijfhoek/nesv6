#include <stdint.h>

#define PPU_CTRL		*(unsigned char *)0x2000
#define PPU_MASK		*(unsigned char *)0x2001
#define PPU_STATUS	*(unsigned char *)0x2002
#define SCROLL			*(unsigned char *)0x2005
#define PPU_ADDRESS	*(unsigned char *)0x2006
#define PPU_DATA		*(unsigned char *)0x2007

#define CONTROLLER_1 (uint8_t *)0x4016
#define CONTROLLER_2 (uint8_t *)0x4017

#define CONTROLLER_MASK_A      0x80
#define CONTROLLER_MASK_B      0x40
#define CONTROLLER_MASK_SELECT 0x20
#define CONTROLLER_MASK_START  0x10
#define CONTROLLER_MASK_UP     0x08
#define CONTROLLER_MASK_DOWN   0x04
#define CONTROLLER_MASK_LEFT   0x02
#define CONTROLLER_MASK_RIGHT  0x01


#define PPU_PATTERN_TABLE_0_ADDRESS 0x0000
#define PPU_PATTERN_TABLE_1_ADDRESS 0x1000

#define PPU_NAMETABLE_0_ADDRESS 0x2000
#define PPU_NAMETABLE_1_ADDRESS 0x2400
#define PPU_NAMETABLE_2_ADDRESS 0x2800
#define PPU_NAMETABLE_3_ADDRESS 0x2C00

#define PPU_PALETTE_ADDRESS 0x3F00


typedef struct
{
    const uint8_t *data;
    const uint16_t length;
} map_t;


const uint8_t MAP_1_DATA[] = {
    15, 4, 20, 52, 255, 63, 38, 0, 39, 19, 103, 0, 40, 9, 38,
    0, 88, 19, 0, 0, 86, 9, 38, 0, 88, 19, 0, 0, 86, 9,
    38, 0, 88, 19, 0, 0, 86, 9, 38, 0, 88, 19, 0, 0, 86,
    9, 38, 0, 88, 19, 0, 0, 86, 9, 38, 0, 88, 19, 0, 0,
    86, 9, 38, 0, 88, 19, 0, 0, 86, 9, 38, 0, 88, 19, 0,
    0, 86, 9, 38, 0, 88, 19, 0, 0, 102, 9, 103, 0, 88, 30,
    0, 0, 88, 30, 0, 0, 88, 30, 0, 0, 88, 30, 0, 0, 88,
    30, 0, 0, 88, 30, 0, 0, 88, 30, 0, 0, 88, 30, 0, 0,
    88, 30, 0, 0, 88, 30, 0, 0, 55, 30, 71, 159, 38, 127, 0,
};

const uint8_t MAP_2_DATA[] = {
    15, 2, 18, 50, 15, 12, 5, 21, 255, 255, 35, 95, 35, 31, 100,
    255, 22, 63, 22, 8, 68, 0, 69, 11, 22, 0, 67, 8, 68, 8,
    35, 0, 85, 11, 6, 0, 83, 17, 35, 0, 52, 11, 68, 0, 53,
    104, 35, 87, 0, 15, 85, 1, 5, 0, 69, 1, 85, 0, 21, 1,
    5, 15, 0,
};

const map_t MAPS[] = {
    { MAP_1_DATA, sizeof(MAP_1_DATA) },
    { MAP_2_DATA, sizeof(MAP_2_DATA) },
};

void set_ppu_address(uint16_t address)
{
    PPU_ADDRESS = (address >> 8) & 0xFF;
    PPU_ADDRESS = address        & 0xFF;
}

void set_scroll(uint16_t scroll)
{
    SCROLL = (scroll >> 8) & 0xFF;
    SCROLL = scroll        & 0xFF;
}

int loading_done = 0;

void __load_map(const uint8_t *data, uint8_t size)
{
    uint8_t i, j;

    PPU_MASK = 0x06;

    set_ppu_address(PPU_PALETTE_ADDRESS);
    for (i = 0; data[i] != 0xFF; i++)
        PPU_DATA = data[i];

    set_ppu_address(PPU_NAMETABLE_0_ADDRESS);
    for (i += 1; i < size; i += 2) {
        PPU_DATA = data[i + 1];
        for (j = data[i]; j; --j)
            PPU_DATA = data[i + 1];
    }

    set_ppu_address(0x0000);
    set_scroll(0);

    // Wait for the next vblank to re-enable the PPU to avoid artifacts
    while (!(PPU_STATUS & 0x80));
    PPU_MASK = 0x1e;
}

void test(const uint8_t *a) {
    *(uint8_t *)0x20 = *a;
}

extern uint8_t read_controller(void);
extern void load_map(const uint8_t *data, uint8_t size);

void main(void)
{
    test(MAP_1_DATA);

    PPU_CTRL = 0x10;

    load_map(MAPS[1].data, MAPS[1].length);

    while (1) {
        uint8_t c = read_controller();
        if (c & CONTROLLER_MASK_RIGHT)
            load_map(MAPS[1].data, MAPS[1].length);
        else if (c & CONTROLLER_MASK_LEFT)
            load_map(MAPS[0].data, MAPS[0].length);
    }
}
