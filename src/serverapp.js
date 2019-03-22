#! /usr/local/bin/node

// based on code by Carpago for Spectrum SE Track

"use strict";


// TvdH changed the code to cater for this api
// POST //api/holdingsinfo

// import the mysql NPM module to be able to use mysql
const mysql = require('mysql');

// import express module (webserver)
let express = require('express');

// use the express module in the app object
let app = express();

// import body-parser module here
let bodyParser = require('body-parser');

// say to the app (express instance) that he might sometimes render
// the body of a POST/PUT from JSON to an Object
app.use(bodyParser.json());


// for now this is to say that everyone can reach this webserver
// from everywhere
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// create a MySQL connection
const connection = mysql.createConnection({
  // make this point to zijpenberg
  host: 'localhost',
  user: 'root',
  password: 'wortel',
  database: 'inphykem'
});

// this method is invoked AFTER the connection is made
// so just to mention "Connected!" (the connection is made above)
connection.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log('Connected!');
  }
});

//TODO getthis from a configfile (with db coords)
// NB put requires field names
const endpoint = {
  'assetcategorygroup': { fields: [ 'name', 'abbrev']},
  'holdings': { children: {'holdinguuinits': {}}},
  'signal': {}
};

function build_crud(from, prefix) {
  for (let ep in from) {
    app.post(`${prefix}${ep}`, function(req, res) {
      const obj = req.body;
      console.log('trying to post: '+JSON.stringify(obj));
      connection.query(`INSERT INTO ${ep} SET ?`, obj, (err, result) => {
        if (!err) {
          res.setHeader('Content-Type', 'application/json')
          connection.query(`SELECT * FROM ${ep} where id=?`, result.insertId, (err, rows) => {
            if (!err) {
              const info = rows[0];
              if (info) {
                res.setHeader('Content-Type', 'application/json')
                res.status(201).end(JSON.stringify(info)); // rloman dit nog ophalen en test via select ...
              } else {
                // error, we did NOT find info
                res.setHeader('Content-Type', 'application/json')
                res.status(404).end();
              }
            } else {
              throw err;
            }
          });
        } else {
          throw err;
        }
      });
    });
    app.get(`${prefix}${ep}`, function(req, res) {
      res.setHeader('Content-Type', 'application/json');
      connection.query(`SELECT * FROM ${ep}`, (err, objs) => {
        if (!err) {
          res.end(JSON.stringify(objs));
        } else {
          throw err;
        }
      });
    });
    app.get(`${prefix}${ep}/:id`, function(req, res) {
      let id = +req.params.id
      connection.query(`SELECT * FROM ${ep} where id=?`, id, (err, rows) => {
        if (!err) {
          console.log('Data received from Db:\n');
          let obj = rows[0];
          if (obj) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(obj));
          } else {
            res.setHeader('Content-Type', 'application/json')
            res.status(404).end();
          }
        } else {
          throw err;
        }
      });
    });
    app.delete(`${prefix}${ep}/:id`, function(req, res) {
      const id = +req.params.id;

      connection.query(
        `DELETE FROM ${ep} WHERE id = ?`, [id], (err, result) => {
          if (!err) {
            console.log(`Deleted ${result.affectedRows} row(s)`);
            res.status(204).end();
          }
          else {
            throw err;
          }
        }
      );
    });
    if (ep.fields) {
      app.put(`${prefix}${ep}/:id`, function(req, res) {

        // First read id from params
        const id = +req.params.id
        const info = req.body;
        const target = concat(ep.field.map(f=> info[f]), [id]);

        connection.query(
          `UPDATE ${ep} SET ${ep.fields.map[f=> f+'=?'].join(', ')} Where ID = ?`, target,
          (err, result) => {
            if (!err) {
              console.log(`Changed ${result.changedRows} row(s)`);

              // end of the update => send response
              // execute a query to find the result of the update
              connection.query(`SELECT * FROM ${ep} where id=?`, [id], (err, rows) => {
                if (!err) {
                  console.log('Data received from Db:\n');

                  const obj = rows[0];

                  console.log(obj);
                  if (obj) {
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify(obj));
                  } else {
                    res.setHeader('Content-Type', 'application/json')
                    console.log("Not found!!!");
                    res.status(404).end(); // rloman send 404???
                  }
                } else {
                  throw err;
                }
              });
            }
            else {
              throw err;
            }
          }
        );
      });
    }
    if (ep.children) {
      for (let ch in ep.children) {
        build_crud(ch, `${prefix}/${ch}`);
      }

    }
  }
}



build_crud(endpoint, '/api/');
// and finally ... run it :-)
// get the server from the app which runs on port 8081
let server = app.listen(8081, function() {

  console.log("Example app listening at http://%s:%s", server.address().address, server.address().port)
});

