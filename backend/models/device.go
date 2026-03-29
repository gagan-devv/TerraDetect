package models

import (
	"regexp"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Device struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	DeviceID   string             `bson:"device_id" json:"device_id"`
	APIKey     string             `bson:"api_key" json:"api_key"`
	Registered bool               `bson:"registered" json:"registered"`
	CreatedAt  primitive.DateTime `bson:"created_at" json:"created_at"`
}

var deviceIDRegexp = regexp.MustCompile(`^[A-Z]{2}[0-9]{4}$`)

// IsValidDeviceID returns true when the device id matches the
// expected pattern: two uppercase letters followed by four digits
// (example: AB1234).
func IsValidDeviceID(id string) bool {
	return deviceIDRegexp.MatchString(id)
}