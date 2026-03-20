package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	Username     string             `bson:"username"`
	PasswordHash string             `bson:"password_hash"`
	DeviceID     string             `bson:"device_id"`
	CreatedAt    primitive.DateTime `bson:"created_at"`
}
