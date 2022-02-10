package services

import (
	"github.com/CHIBI-Verse/chibiverse-nft/bindings/chibiverse"

	"github.com/CHIBI-Verse/chibiverse-nft/consts"
	"github.com/CHIBI-Verse/chibiverse-nft/utils"
)

type Deployer struct {
	cfg consts.IConfig
}

func NewDeployer(cfg consts.IConfig) *Deployer {
	return &Deployer{
		cfg: cfg,
	}
}

func (svc *Deployer) Deploy() error {
	cfg := svc.cfg
	network := cfg.Network()

	client, err := consts.GetClient(cfg.Network())
	if err != nil {
		return utils.LogE(err)
	}

	// 1. Deploy TokenA contract
	chibiverseAddr, _, _, err := chibiverse.DeployChibiverse(utils.MySendOpt(client, network), client, "", "")
	if err != nil {
		return utils.LogE(err)
	}

	// 4. Print address of all contract to used later
	utils.Print(`CHIBIVERSE_ADDR=%s \`, chibiverseAddr.String())

	return nil
}
