package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Device struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	DeviceID   string             `bson:"device_id"`
	APIKey     string             `bson:"api_key"`
	Registered bool               `bson:"registered"`
	CreatedAt  primitive.DateTime `bson:"created_at"`
}