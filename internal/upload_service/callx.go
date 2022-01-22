package upload_service

import (
	"os"

	"github.com/prongbang/callx"
)

func NewCallX() callx.CallX {
	c := callx.Config{
		BaseURL: os.Getenv("UPLOAD_SERVICE_URL"),
		Timeout: 15,
		Interceptor: []callx.Interceptor{
			callx.HeaderInterceptor(callx.Header{
				os.Getenv("API_HEADER"): os.Getenv("API_KEY"),
			}),
			callx.JSONContentTypeInterceptor(),
			// callx.LoggerInterceptor(),
		},
	}
	return callx.New(c)
}
