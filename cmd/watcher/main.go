package main

import (
	"fmt"
	"os"

	"github.com/CHIBI-Verse/chibiverse-nft/consts"
	"github.com/CHIBI-Verse/chibiverse-nft/services"
)

func main() {
	cfg := consts.NewConfig()
	fmt.Printf("Network : %s\n", cfg.Network())
	fmt.Printf("AddressOfToken : %s\n", cfg.AddressOfToken())
	fmt.Printf("METADATA_PATH : %s\n", os.Getenv("METADATA_PATH"))
	fmt.Printf("REVEAL_SCRIPT_PATH : %s\n", os.Getenv("REVEAL_SCRIPT_PATH"))

	services.NewWatcher(cfg).Watch()
}
