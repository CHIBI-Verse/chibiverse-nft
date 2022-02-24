package services

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"os"

	"github.com/CHIBI-Verse/chibiverse-nft/bindings/chibiverse"
	"github.com/CHIBI-Verse/chibiverse-nft/consts"
	"github.com/CHIBI-Verse/chibiverse-nft/internal/upload_service"
	"github.com/CHIBI-Verse/chibiverse-nft/utils"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
)

type Watcher struct {
	cfg consts.IConfig
}

func NewWatcher(cfg consts.IConfig) *Watcher {
	return &Watcher{
		cfg: cfg,
	}
}

// LogTransfer ..
type LogTransfer struct {
	From   common.Address
	To     common.Address
	Tokens *big.Int
}

// LogApproval ..
type LogApproval struct {
	TokenOwner common.Address
	Spender    common.Address
	Tokens     *big.Int
}

func handleLog(vLog types.Log, instance *chibiverse.Chibiverse, req upload_service.UploadService) {

	// defer func() {
	// 	if r := recover(); r != nil {
	// 		fmt.Println("Recovered. Error:\n", r)
	// 	}
	// }()

	logTransferSig := []byte("Transfer(address,address,uint256)")
	// LogApprovalSig := []byte("Approval(address,address,uint256)")
	logTransferSigHash := crypto.Keccak256Hash(logTransferSig)
	// logApprovalSigHash := crypto.Keccak256Hash(LogApprovalSig)

	// fmt.Printf("Log Block Number: %d\n", vLog.BlockNumber)
	// fmt.Printf("Log Index: %d\n", vLog.Index)

	switch vLog.Topics[0].Hex() {
	case logTransferSigHash.Hex():
		from := common.HexToAddress(vLog.Topics[1].Hex())
		if from.String() == "0x0000000000000000000000000000000000000000" {
			// fmt.Printf("Log Name: Transfer [%s]\n", vLog.Topics[0].Hex())
			// fmt.Printf("From: %s\n", common.HexToAddress(vLog.Topics[1].Hex()))
			// fmt.Printf("From: %s\n", vLog.Topics[1])
			// fmt.Printf("From: %s\n", vLog.Topics[1].Big())
			// fmt.Printf("To: %s\n", common.HexToAddress(vLog.Topics[2].Hex()))
			// fmt.Printf("To: %s\n", vLog.Topics[2])
			// fmt.Printf("To: %s\n", vLog.Topics[2].Big())
			// fmt.Printf("Token ID: %s\n", common.HexToAddress(vLog.Topics[3].Hex()))
			// fmt.Printf("Token ID: %s\n", vLog.Topics[3])
			fmt.Printf("Token ID: %s\n", vLog.Topics[3].Big())

			if os.Getenv("PUBLIC_PATH") != "" {
				src := fmt.Sprintf("%s/%d", os.Getenv("METADATA_PATH"), int(vLog.Topics[3].Big().Int64()))
				desc := fmt.Sprintf("%s/%d", os.Getenv("PUBLIC_PATH"), int(vLog.Topics[3].Big().Int64()))

				_, err := utils.Copy(src, desc)
				if err != nil {
					fmt.Printf("Error : %s\n", err.Error())

				} else {
					fmt.Printf("Copy : %s\n", src)
					fmt.Printf("To : %s\n", desc)
				}
			}

			fmt.Printf("Reveal : %s\n", utils.Reveal(int(vLog.Topics[3].Big().Int64())))

			// token, err := instance.TokenURI(&bind.CallOpts{}, vLog.Topics[3].Big())
			// if err != nil {
			// 	log.Fatal(err)
			// }

			// fmt.Printf("Token URI: %s\n", token)

		}

	default:
		// j, _ := json.MarshalIndent(vLog, "", " ")
		// fmt.Println(string(j))

	}
}

func (svc *Watcher) Watch() {

	callX := upload_service.NewCallX()
	uploadService := upload_service.NewUploadService(callX)

	cfg := svc.cfg

	network := cfg.Network()

	client, err := consts.GetWsClient(network)
	// wss: //rpc-mainnet.matic.network or
	// wss: //ws-matic-mainnet.chainstacklabs.com or
	// wss: //rpc-mainnet.maticvigil.com/ws or
	// wss: //rpc-mainnet.matic.quiknode.pro or
	// wss: //matic-mainnet-full-ws.bwarelabs.com or
	// wss: //matic-mainnet-archive-ws.bwarelabs.com
	// client, err := ethclient.Dial("wss://ws-matic-mainnet.chainstacklabs.com")
	// client, err := ethclient.Dial("wss://mainnet.infura.io/ws/v3/b590d3c3bf7c4b199c7c7ae31c1d061f")
	if err != nil {
		utils.LogE(err)
	}

	contractAddress := common.HexToAddress(cfg.AddressOfToken().String())
	query := ethereum.FilterQuery{
		// FromBlock: big.NewInt(13817018),
		// ToBlock:   big.NewInt(13827018),
		Addresses: []common.Address{contractAddress},
	}

	// contractAbi, err := abi.JSON(strings.NewReader(string(ToffyNFT.CassetteFactoryABI)))
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// logTransferSig := []byte("Transfer(address,address,uint256)")
	// // LogApprovalSig := []byte("Approval(address,address,uint256)")
	// logTransferSigHash := crypto.Keccak256Hash(logTransferSig)
	// // logApprovalSigHash := crypto.Keccak256Hash(LogApprovalSig)

	tokenAddress := common.HexToAddress(cfg.AddressOfToken().String())
	instance, err := chibiverse.NewChibiverse(tokenAddress, client)
	if err != nil {
		log.Fatal(err)
	}

	logs := make(chan types.Log)
	sub, err := client.SubscribeFilterLogs(context.Background(), query, logs)
	if err != nil {
		log.Fatal(err)
	}

	for {
		select {
		case err := <-sub.Err():
			log.Fatal(err)
		case vLog := <-logs:
			handleLog(vLog, instance, uploadService) // pointer to event log
		}
	}

}
