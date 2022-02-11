package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/CHIBI-Verse/chibiverse-nft/consts"
	"github.com/CHIBI-Verse/chibiverse-nft/services"
	"github.com/labstack/echo/v4"
)

type HiddenMetadata struct {
	Name  string `json:"name" xml:"name"`
	Email string `json:"email" xml:"email"`
}

func main() {
	cfg := consts.NewConfig()
	fmt.Printf("Network : %s\n", cfg.Network())
	fmt.Printf("AddressOfToken : %s\n", cfg.AddressOfToken())
	fmt.Printf("METADATA_PATH : %s\n", os.Getenv("METADATA_PATH"))
	fmt.Printf("REVEAL_SCRIPT_PATH : %s\n", os.Getenv("REVEAL_SCRIPT_PATH"))

	go services.NewWatcher(cfg).Watch()

	e := echo.New()
	e.GET("/metadata/:id", func(c echo.Context) error {
		id := c.Param("id")
		tokenID, err := strconv.Atoi(id)
		if err != nil {
			return echo.NewHTTPError(http.StatusNotFound, "Not Found.")
		}

		if tokenID < 1 || tokenID > 10000 {
			return echo.NewHTTPError(http.StatusNotFound, "Not Found.")
		}

		str := fmt.Sprintf(`{
			"name": "CHIBI #%d",
			"description": "A collection of 10,000 NFTs minted on the Ethereum blockchain. Every character is created by a random algorithm which ensures that each character is unique and differentiated from the others.",
			"image": "ipfs://QmdttDSCMFk3o6vseaNGjimQ2VFCfkcqwdv2uvjAmNQKxC",
			"animation_url": "ipfs://QmSUoZUxAfjfXoF5aMYL1GuAPDrHGGjr72CdNB4Bni672Q",
			"external_url": "https://chibiverse.fun",
			"creator": "Maxvoy",
			"attributes": [
			  {
				"trait_type": "CHIBI #%d",
				"value": "?"
			  }
			]
		  }`, tokenID, tokenID)

		var obj map[string]interface{}
		json.Unmarshal([]byte(str), &obj)

		return c.JSON(http.StatusOK, obj)
	})
	e.Logger.Fatal(e.Start(":1323"))
}
