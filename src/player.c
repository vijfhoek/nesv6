#include "player.h"
#include "controller.h"

#define SPRITE_DATA (uint8_t *)0x0200

#define CLAMP_MAX(x, max) { if (x > max) x = max; }
#define CLAMP_MIN(x, min) { if (x < min) x = min; }
#define CLAMP(x, min, max) { if (x > max) x = max; else if (x < min) x = min; }

extern uint8_t map_x, map_y;
extern uint8_t reload_map;
extern uint8_t count;

int8_t  player_vx = 0,    player_vy = 0;
uint8_t player_px = 15*8, player_py = 20*8;

uint8_t player_grounded = 1;
uint8_t player_flipped = 0;
uint8_t action_pressed = 0;

extern uint8_t collision_map[120];

static uint8_t check_collision(const uint8_t x, const uint8_t y)
{
    uint8_t index = y / 8 * 4 + x / 64;
    uint8_t mask  = 0x80 >> (x / 8 % 8);

    return collision_map[index] & mask;
}

void init_player(void)
{
    *PLAYER_HEAD_ATTR = 0x00;
    *PLAYER_BODY_ATTR = 0x00;

    *PLAYER_HEAD_TILE = 0x01;
    *PLAYER_BODY_TILE = 0x03;
}

void update_player(const uint8_t c)
{
    int16_t new_x, new_y;

    // Vertical movement
    if (c & CONTROLLER_MASK_ACTION && !action_pressed && player_grounded) {
        player_flipped ^= 1;
        action_pressed = 1;

        *PLAYER_HEAD_ATTR ^= OAM_ATTR_FLIP_V;
        *PLAYER_BODY_ATTR ^= OAM_ATTR_FLIP_V;

        player_grounded = 0;
    }
    else if (!(c & CONTROLLER_MASK_ACTION) && action_pressed) {
        action_pressed = 0;
    }

    player_vy += player_flipped ? -4 : 4;
    CLAMP(player_vy, -20, 20);

    new_y = player_py + player_vy / 5;

    // Map swapping
    if (new_y + 7 > 216 && player_vy > 0) {
        map_y += 1;
        reload_map = 1;
        player_py = 0;
        return;
    }
    if (new_y < 0 && player_vy < 0) {
        map_y -= 1;
        reload_map = 1;
        player_py = 208;
        return;
    }

    // Check for collision
    if (player_flipped && (check_collision(player_px, new_y) || check_collision(player_px + 7, new_y))) {
        player_grounded = 1;
        player_py = new_y / 8 * 8 + 8;
        player_vy = 0;
    }
    else if (!player_flipped && (check_collision(player_px, new_y + 16) || check_collision(player_px + 7, new_y + 16))) {
        player_grounded = 1;
        player_py = new_y / 8 * 8;
        player_vy = 0;
    }
    else {
        player_grounded = 0;
        player_py = new_y;
    }

    // Horizontal movement
    if (c & CONTROLLER_MASK_RIGHT) {
        *PLAYER_HEAD_ATTR &= ~OAM_ATTR_FLIP_H;
        player_vx += 3;
        CLAMP_MAX(player_vx, 12);
    }
    else if (player_vx > 0) {
        player_vx -= 2;
    }

    if (c & CONTROLLER_MASK_LEFT) {
        *PLAYER_HEAD_ATTR |= OAM_ATTR_FLIP_H;

        player_vx -= 3;
        CLAMP_MIN(player_vx, -12);
    }
    else if (player_vx < 0) {
        player_vx += 2;
    }

    new_x = player_px + player_vx / 5;

    // Handle map switching when moving off the edges
    if (new_x + 7 > 256 && player_vx > 0) {
        map_x += 1;
        reload_map = 1;
        player_px = 0;
        return;
    }
    else if (new_x < 0 && player_vx < 0) {
        map_x -= 1;
        reload_map = 1;
        player_px = 247;
        return;
    }

    // Check for collision
    if (player_vx > 0 && (check_collision(new_x + 7, player_py) || check_collision(new_x + 7, player_py + 15)))
        player_px = new_x / 8 * 8;
    else if (player_vx < 0 && (check_collision(new_x, player_py) || check_collision(new_x, player_py + 15)))
        player_px = new_x / 8 * 8 + 8;
    else
        player_px = new_x;

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
