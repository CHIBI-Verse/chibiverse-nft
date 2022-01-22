package upload_service

import (
	"fmt"
	"net/http"

	"github.com/prongbang/callx"
)

type UploadService interface {
	UploadNFT(tokenID int)
}

type uploadService struct {
	CallX callx.CallX
}

func (d *uploadService) UploadNFT(tokenID int) {

	custom := callx.Custom{
		URL:    fmt.Sprintf("/api/upload/%d", tokenID),
		Method: http.MethodGet,
		Body:   callx.Body{},
	}
	_ = d.CallX.Req(custom)

	// var rs map[string]interface{}
	// if resp.Code == http.StatusOK {

	// }

	// _ = json.Unmarshal(resp.Data, &rs)
	// fmt.Println("Response => : ", string(resp.Data))

}

func NewUploadService(callX callx.CallX) UploadService {
	return &uploadService{
		CallX: callX,
	}
}
