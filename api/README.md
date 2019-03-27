# README.MD apiloader

## Intro

API loader, once installed, loads a JSON config file from a command 

## How to use


```
node api [config]
```

This command loads [config].json, residing in the same folder as the script, which has the following layout:

```
{
  "prefix" : "api",
  "db" : {
    "host" : "localhost",
    "user" : "root",
    "password" : "root",
    "database" : "quiz"
  },
  "routes" : [
    { "route" : "players",
      "key" : "id",
      "methods" : ["post", "get", "put", "delete"],
      "fields" : [ "name","score"]
    }

  ]
}

```
Which adds the following routes & methods to the API, with the following available requests to the API;

| URL     | Method | Db Table accessed    |
| :------------- | :------------- | :--------------|
| myhost:8081/api/players       | POST |  players {json} |
| myhost:8081/api/players/:id       | GET |  players |
| myhost:8081/api/players/:id      | PUT |  players {json}|
| myhost:8081/api/players/:id       | DELETE |  players |
