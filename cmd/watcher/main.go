package main

import (
	"github.com/CHIBI-Verse/chibiverse-nft/consts"
	"github.com/CHIBI-Verse/chibiverse-nft/services"
)

func main() {
	cfg := consts.NewConfig()
	services.NewWatcher(cfg).Watch()
}
