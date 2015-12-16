package main

import (
	"fmt"
	"github.com/taskcluster/taskcluster-client-go/awsprovisioner"
	"os"
)

func main() {
	Awsprovisioner := awsprovisioner.New(os.Getenv("TASKCLUSTER_CLIENT_ID"), os.Getenv("TASKCLUSTER_ACCESS_TOKEN"))
	callSummary := Awsprovisioner.AwsState()
	if callSummary.Error != nil {
		panic(callSummary.Error)
	}
	fmt.Println(callSummary.HttpResponseBody)
}
