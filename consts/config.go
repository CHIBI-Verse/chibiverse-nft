package consts

import (
	"os"

	"github.com/ethereum/go-ethereum/common"
)

type Network string

const (
	Mainnet    Network = "mainnet"
	Ropten     Network = "ropten"
	GanacheCLI Network = "ganache-cli"
	BSCTest    Network = "bsctest"
	BSCMain    Network = "bscmain"
)

type Token string

type IConfig interface {
	Network() Network
	AddressOfToken() common.Address
}
type Config struct {
}

func NewConfig() *Config {
	return &Config{}
}

func (cfg *Config) Network() Network {
	return Network(os.Getenv("NETWORK"))
}

func (cfg *Config) AddressOfToken() common.Address {

	return common.HexToAddress(os.Getenv("CHIBIVERSE_ADDR"))
}
