package consts

import (
	"fmt"
	"os"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

func GetClient(network Network) (*ethclient.Client, error) {
	networkURL := ""
	if network == GanacheCLI {
		networkURL = "http://127.0.0.1:8545"
	} else if network == BSCTest {
		networkURL = "https://data-seed-prebsc-2-s2.binance.org:8545/"
	} else if network == BSCMain {
		networkURL = "https://bsc-dataseed.binance.org/"
	} else if network == Rinkeby {
		networkURL = "https://rinkeby-light.eth.linkpool.io/"
	}

	client, err := ethclient.Dial(networkURL)
	if err != nil {
		return nil, err
	}

	return client, nil
}

func GetWsClient(network Network) (*ethclient.Client, error) {
	networkURL := ""
	if network == GanacheCLI {
		networkURL = "ws://127.0.0.1:8545/ws"
	} else if network == Mainnet {
		networkURL = "wss://mainnet.infura.io/ws/v3/" + os.Getenv("INFURA_ID")
	} else if network == BSCMain {
		networkURL = ""
	} else if network == Rinkeby {
		networkURL = "wss://rinkeby-light.eth.linkpool.io/ws"
	}

	fmt.Printf("Endpoint : %s\n", networkURL)

	client, err := ethclient.Dial(networkURL)
	if err != nil {
		return nil, err
	}

	return client, nil
}

func AddressZero() common.Address {
	return common.HexToAddress("0x0")
}
