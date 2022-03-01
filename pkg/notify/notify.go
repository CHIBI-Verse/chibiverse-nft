package notify

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
)

func Notify(m string) {

	data := url.Values{}
	data.Set("message", m)

	req, _ := http.NewRequest("POST", "https://notify-api.line.me/api/notify", strings.NewReader(data.Encode()))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("LineToken"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("%s \n", err)
	}
	defer resp.Body.Close()
}
