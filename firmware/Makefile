CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -std=c11 -Iinclude
LDFLAGS ?=

BIN_DIR := build
BIN := $(BIN_DIR)/eco_nexus_engine

SRCS := src/eco_nexus.c src/main.c
OBJS := $(SRCS:%.c=$(BIN_DIR)/%.o)

.PHONY: all clean

all: $(BIN)

$(BIN_DIR):
	mkdir -p $(BIN_DIR)/src

$(BIN_DIR)/src/%.o: src/%.c | $(BIN_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(BIN): $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) -o $@ $(LDFLAGS)

clean:
	rm -rf $(BIN_DIR)

