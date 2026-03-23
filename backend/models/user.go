package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	Username     string             `bson:"username" json:"username"`
	PasswordHash string             `bson:"password_hash" json:"-"`
	DeviceID     string             `bson:"device_id" json:"device_id"`
	CreatedAt    primitive.DateTime `bson:"created_at" json:"created_at"`
}