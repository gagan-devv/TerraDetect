package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type SensorReading struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	DeviceID    string             `bson:"device_id" json:"device_id"`
	Temperature float64            `bson:"temperature" json:"temperature"`
	PH          float64            `bson:"ph" json:"ph"`
	Humidity    float64            `bson:"humidity" json:"humidity"`
	EC          float64            `bson:"ec" json:"ec"`
	N           float64            `bson:"N" json:"N"`
	P           float64            `bson:"P" json:"P"`
	K           float64            `bson:"K" json:"K"`
	Moisture    float64            `bson:"moisture" json:"moisture"`
	Timestamp   primitive.DateTime `bson:"timestamp" json:"timestamp"`
}
