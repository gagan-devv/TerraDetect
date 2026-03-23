package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Device struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	DeviceID   string             `bson:"device_id" json:"device_id"`
	APIKey     string             `bson:"api_key" json:"api_key"`
	Registered bool               `bson:"registered" json:"registered"`
	CreatedAt  primitive.DateTime `bson:"created_at" json:"created_at"`
}