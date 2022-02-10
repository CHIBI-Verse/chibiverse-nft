package services

import (
	"encoding/json"
	"fmt"
	"math/big"

	"github.com/CHIBI-Verse/chibiverse-nft/bindings/chibiverse"
	"github.com/CHIBI-Verse/chibiverse-nft/consts"
	"github.com/CHIBI-Verse/chibiverse-nft/utils"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
)

type Writer struct {
	cfg consts.IConfig
}

func NewWriter(cfg consts.IConfig) *Writer {
	return &Writer{
		cfg: cfg,
	}
}

func (svc *Writer) Write() error {
	cfg := svc.cfg
	network := cfg.Network()

	client, err := consts.GetClient(cfg.Network())
	if err != nil {
		return utils.LogE(err)
	}

	// 1. Create TokenA contrat and approve 1ml tokens
	chibiverseContract, err := chibiverse.NewChibiverse(cfg.AddressOfToken(), client)
	if err != nil {
		return utils.LogE(err)
	}

	myAddr, err := utils.MyAccountAddress(client, network)
	if err != nil {
		return utils.LogE(err)
	}
	utils.Print("My myAddr = %s", myAddr)

	totalSupply, err := chibiverseContract.TotalSupply(&bind.CallOpts{})
	if err != nil {
		return utils.LogE(err)
	}
	utils.Print("TotalSupply = %s", totalSupply)

	cost, err := chibiverseContract.PRICE(&bind.CallOpts{})
	if err != nil {
		return utils.LogE(err)
	}
	utils.Print("Cost = %s", cost)

	paused, err := chibiverseContract.Paused(&bind.CallOpts{})
	if err != nil {
		return utils.LogE(err)
	}

	fmt.Println("Paused = ", paused)

	if paused {
		_, err = chibiverseContract.Unpause(utils.MySendOpt(client, network))
		if err != nil {
			return utils.LogE(err)
		}

	}

	_, err = chibiverseContract.Mint(utils.MySendOptWithValue(utils.MySendOpt(client, network), cost), big.NewInt(1))
	if err != nil {
		return utils.LogE(err)
	}
	// utils.Print("Mint = %s", r)

	walletOfOwner, err := chibiverseContract.WalletOfOwner(&bind.CallOpts{}, myAddr)
	if err != nil {
		return utils.LogE(err)
	}

	j, _ := json.MarshalIndent(walletOfOwner, "", " ")

	fmt.Println(string(j))

	return nil
}
