package db

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Database struct {
	Users         *mongo.Collection
	Devices       *mongo.Collection
	SensorData    *mongo.Collection
	TokenDenyList *mongo.Collection
}

func Connect(uri, dbName string) (*Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	d := client.Database(dbName)
	database := &Database{
		Users:         d.Collection("users"),
		Devices:       d.Collection("device_ids"),
		SensorData:    d.Collection("sensor_data"),
		TokenDenyList: d.Collection("token_deny_list"),
	}

	database.SensorData.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "device_id", Value: 1}, {Key: "timestamp", Value: -1}},
	})

	ttl := int32(0)
	database.TokenDenyList.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "expires_at", Value: 1}},
		Options: &options.IndexOptions{ExpireAfterSeconds: &ttl},
	})

	return database, nil
}
