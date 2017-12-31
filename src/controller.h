#ifndef CONTROLLER_H_
#define CONTROLLER_H_
#include <stdint.h>

#define CONTROLLER_MASK_A      0x80
#define CONTROLLER_MASK_B      0x40
#define CONTROLLER_MASK_SELECT 0x20
#define CONTROLLER_MASK_START  0x10
#define CONTROLLER_MASK_UP     0x08
#define CONTROLLER_MASK_DOWN   0x04
#define CONTROLLER_MASK_LEFT   0x02
#define CONTROLLER_MASK_RIGHT  0x01

#define CONTROLLER_MASK_ACTION (CONTROLLER_MASK_A | CONTROLLER_MASK_B)

#define CONTROLLER_1 (uint8_t *)0x4016
#define CONTROLLER_2 (uint8_t *)0x4017

extern uint8_t read_controller(void);

#endif