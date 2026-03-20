package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type SensorReading struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	DeviceID    string             `bson:"device_id"`
	Temperature float64            `bson:"temperature"`
	PH          float64            `bson:"ph"`
	Humidity    float64            `bson:"humidity"`
	EC          float64            `bson:"ec"`
	N           float64            `bson:"N"`
	P           float64            `bson:"P"`
	K           float64            `bson:"K"`
	Moisture    float64            `bson:"moisture"`
	Timestamp   primitive.DateTime `bson:"timestamp"`
}
