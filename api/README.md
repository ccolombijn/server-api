# REST API Loader & tool

## Intro

Loads a JSON config file  from command to start a REST API service.

## How to use


```
node api [config]
```

This command loads `[config].json` (which can be generated with `tool -g config`, see below), residing in the same folder as the script, which has the following layout:

```
{
  "prefix" : "api",
  "db" : {
    "host" : "myhost:8081",
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

## Generate config with `tool -g`
Create a new JSON config file with 
```
node tool -g config
```

## Update config with `tool -u`
Update a existing JSON config file with 
```
node tool -u config
```
