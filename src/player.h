#ifndef PLAYER_H_
#define PLAYER_H_

#include <stdint.h>

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

void init_player(void);
void update_player(const uint8_t c);

#endif PLAYER_H_
