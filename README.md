Currently compiled with:

```bash
cl65 -g -O0 src/reset.s src/main.c src/player.c src/map.s src/controller.s src/stars.s \
     -o v6.nes -C nes.cfg -Wl --dbgfile,v6.dbg
```

TODO: Make a Makefile and a proper README
