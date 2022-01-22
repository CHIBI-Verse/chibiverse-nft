package services

import (
	"fmt"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/CHIBI-Verse/chibiverse-nft/bindings/chibiverse"
	"github.com/CHIBI-Verse/chibiverse-nft/consts"
	"github.com/CHIBI-Verse/chibiverse-nft/utils"
)

type Reader struct {
	cfg consts.IConfig
}

func NewReader(cfg consts.IConfig) *Reader {
	return &Reader{
		cfg: cfg,
	}
}

func (svc *Reader) Read() error {
	cfg := svc.cfg

	client, err := consts.GetClient(cfg.Network())
	if err != nil {
		return utils.LogE(err)
	}

	// 1. Create ThePool contract using address from ENV
	chibiverseContract, err := chibiverse.NewChibiverse(cfg.AddressOfToken(), client)
	if err != nil {
		return utils.LogE(err)
	}

	t, err := chibiverseContract.TotalSupply(&bind.CallOpts{})

	fmt.Println("TotalSupply", t.String())

	return nil
}
