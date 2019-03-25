#! /usr/local/bin/node

// based on code by Carpago for Spectrum SE Track

"use strict";

module.exports = class Server {
  constructor(db_parms, routing) {
    this.db_parms = db_parms;
    this.routing = routing;
    this.init();
  }
  init() { // call this to run the server
    // TvdH changed the code to make it a library
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
    const connection = mysql.createConnection(this.db_parms);

    // this method is invoked AFTER the connection is made
    // so just to mention "Connected!" (the connection is made above)
    connection.connect((err) => {
      if (err) {
        throw err;
      } else {
        console.log('Connected!');
      }
    });

    function build_crud(from, name, prefix) {
      let flags = {};
      if (from.crud) {
        // split from.crud in characters
        let tail = from.crud.split('');
        tail.forEach((v) => flags[v] = 1);
      }
      if (from.proc) app.get(`${prefix}`, function(req, res) {
        const obj = req.body;
        console.log(`setting up proc for ${prefix}`);
        // console.log(`setting up proc params: ${JSON.stringify(req.params)}`);
        console.log(`setting up proc query: ${JSON.stringify(req.query)}`);
        // console.log(`setting up proc route: ${JSON.stringify(req.route)}`);
        // console.log(`setting up proc res: ${JSON.stringify(res)}`);
        res.setHeader('Content-Type', 'application/json');
        // let cmd_tmpl = '' + from.proc;
        // let cmd = cmd_tmpl.replace(/%/g, name); // TvdH: is this a smart symbol to use for this? Is it safe in SQL?
        const cmd = from.proc(req.query);
        console.log(`trying to run "${cmd}" of ${name}`);
        connection.query(cmd, obj, (err, result) => {
          if (!err) {
            console.log(`proc ${cmd} ran`);
            const info = result;
            if (info) {
              res.setHeader('Content-Type', 'application/json')
              res.status(201).end(JSON.stringify(info));
              console.log(`proc ${cmd} produced results`);
            } else {
              // error, proc failed
              res.setHeader('Content-Type', 'application/json')
              res.status(404).end();
              console.log(`proc ${cmd} did not produce results`);
            }
          } else {
            throw err;
          }
        });
      });
      if (!from.transparent) { // probably not needed: just skip the crud
        console.log(`setting up crud for ${prefix}`);
        if (flags.C) app.post(`${prefix}`, function(req, res) {
          const obj = req.body;
          console.log('trying to post: '+JSON.stringify(obj));
          connection.query(`INSERT INTO ${name} SET ?`, obj, (err, result) => {
            if (!err) {
              res.setHeader('Content-Type', 'application/json')
              connection.query(`SELECT * FROM ${name} where id=?`, result.insertId, (err, rows) => {
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
        if (flags.R) app.get(`${prefix}`, function(req, res) {
          res.setHeader('Content-Type', 'application/json');
          connection.query(`SELECT * FROM ${name}`, (err, objs) => {
            if (!err) {
              res.end(JSON.stringify(objs));
            } else {
              throw err;
            }
          });
        });
        if (flags.r) app.get(`${prefix}/:id`, function(req, res) {
          let id = +req.params.id
          connection.query(`SELECT * FROM ${name} where id=?`, id, (err, rows) => {
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
        if (flags.d) app.delete(`${prefix}/:id`, function(req, res) {
          const id = +req.params.id;

          connection.query(
            `DELETE FROM ${name} WHERE id = ?`, [id], (err, result) => {
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
        if (from.fields && flags.u) {
          app.put(`${prefix}/:id`, function(req, res) {

            // First read id from params
            const id = +req.params.id
            const info = req.body;
            const target = concat(from.fields.map(f=> info[f]), [id]);

            connection.query(
              `UPDATE ${name} SET ${from.fields.map[f=> f+'=?'].join(', ')} Where ID = ?`, target,
              (err, result) => {
                if (!err) {
                  console.log(`Changed ${result.changedRows} row(s)`);

                  // end of the update => send response
                  // execute a query to find the result of the update
                  connection.query(`SELECT * FROM ${name} where id=?`, [id], (err, rows) => {
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
      }

      if (from.children) {
        build_crud_children(from.children, prefix);
      }
    }

    function build_crud_children(children, prefix) {
      for (let ch in children) {
        build_crud(children[ch], ch, `${prefix}/${ch}`);
      }
    }

    build_crud_children(this.routing, '/api');
    // and finally ... run it :-)
    // get the server from the app which runs on port 8081
    let server = app.listen(this.db_parms.port, function() {
      console.log("Example app listening at http://%s:%s", server.address().address, server.address().port)
    });
  }
}
