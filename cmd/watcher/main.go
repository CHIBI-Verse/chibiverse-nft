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

	// e := echo.New()
	// e.GET("/metadata/:id", func(c echo.Context) error {
	// 	id := c.Param("id")
	// 	tokenID, err := strconv.Atoi(id)
	// 	if err != nil {
	// 		return echo.NewHTTPError(http.StatusNotFound, "Not Found.")
	// 	}

	// 	if tokenID < 1 || tokenID > 10000 {
	// 		return echo.NewHTTPError(http.StatusNotFound, "Not Found.")
	// 	}

	// 	str := fmt.Sprintf(`{
	// 		"name": "CHIBI #%d",
	// 		"description": "A collection of 10,000 NFTs minted on the Ethereum blockchain. Every character is created by a random algorithm which ensures that each character is unique and differentiated from the others.",
	// 		"image": "ipfs://QmeTCAbU2iz1pkXxzQn4QqKnQeNYwpLPUndgPgsEWczEcv",
	// 		"animation_url": "ipfs://QmUXnbPS1F9rgbceP6B3eYirrPCM2R8HoEEeYETq7p7ugq",
	// 		"external_url": "https://chibiverse.fun",
	// 		"creator": "Maxvoy",
	// 		"attributes": [
	// 		  {
	// 			"trait_type": "CHIBI #%d",
	// 			"value": "?"
	// 		  }
	// 		]
	// 	  }`, tokenID, tokenID)

	// 	var obj map[string]interface{}
	// 	json.Unmarshal([]byte(str), &obj)

	// 	return c.JSON(http.StatusOK, obj)
	// })
	// e.Logger.Fatal(e.Start(":1323"))
}
