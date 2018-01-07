AS := ca65
CC := cc65
LD := ld65

LDFLAGS := -C nes.cfg --dbgfile v6.dbg
TARGET := v6.nes

OBJDIR := obj
SRCDIR := src

CSOURCES := src/main.c src/player.c
ASSOURCES := src/controller.s src/map.s src/reset.s src/stars.s

COBJECTS := $(CSOURCES:src/%.c=obj/%.o)
ASOBJECTS := $(ASSOURCES:src/%.s=obj/%.o)


$(TARGET): $(COBJECTS) $(ASOBJECTS)
	@echo -e "\033[32mLinking\033[0m"
	$(LD) $(LDFLAGS) \
		$(COBJECTS) \
		$(ASOBJECTS) \
		$$CC65_HOME/lib/nes.lib -o $@


$(ASOBJECTS): obj/%.o:src/%.s
	@echo -e "\033[32mAssembling $<\033[0m"
	@mkdir -p $(OBJDIR)
	$(AS) $(ASFLAGS) $< -o $@


$(COBJECTS): obj/%.o:src/%.c
	@echo -e "\033[32mCompiling $<\033[0m"
	@mkdir -p $(OBJDIR)
	$(CC) $(CFLAGS) $< -o $(@:%.o=%.s)
	$(AS) $(ASFLAGS) $(@:%.o=%.s) -o $@
	rm $(@:%.o=%.s)


clean:
	rm obj/*
