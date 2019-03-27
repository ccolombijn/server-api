"use strict";

const api = (function(){

  const mysql = require( 'mysql' )
  const express = require( 'express' )
  const app = express()
  const bodyParser = require( 'body-parser' )
  const fs = require('fs')


  app.use( bodyParser.json() )
  app.use( function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
  })
  // config
  const config = process.argv[3]
  ? fs.readFile( `${process.argv[3]}.json`, (err, data)=>JSON.parse(data))
  : {
    db : {
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'quiz'
    },
    routes : [

      /*{ route : 'players' }, //set.getAll
      { route : 'players/:id' , method : 'get' }, // set.getOne
      { route : 'players/:id', method : 'delete' }, // set.delete
      { route : 'players', method : 'post' }, // set.post
      { route : 'players/:id', method : 'put', fields : ['name','score'] }*/  // set.put
      { route : 'players',
        methods : [ 'get', 'delete', 'post', 'put' ],
        key : 'id',
        fields : ['name','score']
      }
    ]
  }


  const connection = mysql.createConnection( config.db )
  connection.connect((err) => {
    if (err) {
      throw err;
    } else {
      console.log('Connected!');
    }
  });


  const set = (() => {
    const pre = config.prefix ? config.prefix : 'api'
// get
// .............................................................................
    const getOne = ( route ) => {
      app.get( `/${pre}/${route}`, function( req, res ) {
        route = route.split('/:')
        let key = +req.params[ route[1] ]

        connection.query(`SELECT * FROM ${route[0]} where ${route[1]}=?`, key, ( err, rows ) => {
          if (!err) {
            let record = rows[0];
            res.setHeader('Content-Type', 'application/json')
            record ? res.end(JSON.stringify( record ) ) : res.status(404).end()
          } else {
            throw err
          }
        })
      });
    }

    const getAll = ( route ) => {
      app.get( `/${pre}/${route}`, function(req, res) {

        res.setHeader('Content-Type', 'application/json')

        connection.query(`SELECT * FROM ${route}`, ( err, records ) => {
          if (!err) {
            res.end( JSON.stringify(records) )
          } else {
            throw err
          }
        })
      });
    }

  const _get = ( route ) => route.includes( '/:id' ) ? getOne( route ) : getAll( route )


// put
// .............................................................................
  const _put = (route, fields) => {
    app.put(`/${pre}/${route}`, function(req, res) {
          route = route.split('/:')
          // First read id from params
          let id = +req.params[route[1]]
          let body = req.body;
          let query = `UPDATE ${route[0]} SET `
          for( let field in fields){
            query =+ `${fields[field]}=?`
            if( field != fields.length ) query =+ ','
          }
          query =+ ` WHERE ${route[1]}=?`
          connection.query(query,[body.item, id], (err, result) => {
              if (!err) {
                console.log(`Changed ${result.changedRows} row(s)`);

                // end of the update => send response
                // execute a query to find the result of the update
                connection.query(`SELECT * FROM ${route[0]} where ${route[1]}=?`, [id], (err, rows) => {
                  if (!err) {
                    console.log('Data received from Db:\n');

                    let record = rows[0];

                    console.log(record);
                    if (record) {
                      res.setHeader('Content-Type', 'application/json')
                      res.end(JSON.stringify(record));
                    } else {
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
        });
      });


  }
// .............................................................................
  const _post = (route) => {
    app.post(`/api/${route}`, function(req, res) {


      connection.query(`INSERT INTO ${route} SET ?`, req.body, (err, result) => {
        if (!err) {
          res.setHeader('Content-Type', 'application/json')
          connection.query(`SELECT * FROM ${route} where id=?`, result.insertId, (err, rows) => {
            if (!err) {
              let record = rows[0];
              if (record) {
                res.setHeader('Content-Type', 'application/json')
                res.status(201).end(JSON.stringify(record));
              } else {
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

  }
// .............................................................................
  const _delete = (route) => {
    app.delete('/api/players/:id', function( req, res ) {
      let id =+req.params.id;

      connection.query( `DELETE FROM ${route} WHERE id = ?`, [id], ( err, result ) => {
        if (!err) {
          res.status(204).end();
        } else {
            throw err;
        }
      })
    });
  }

  return {
    get : _get,
    put : _put,
    post : _post,
    delete : _delete
  }
})()

const setRoutes = (function(){
  /*const setMethod = (item) => {
    if(  item.route.split(':')[1] && item.method === 'delete'){ //delete
      console.log(`${item.route.split('/')[0]} delete`)
      set.delete( item.route )

    }else if ( item.route.split(':')[1] && item.method === 'get' ) { // getOne
      console.log(`${item.route.split('/')[0]} getOne`)
      set.get( item.route )

    }else if (item.method === 'put' && item.fields ) { // put
      console.log(`${item.route} put`)
      set.put( item.route, item.fields )

    }else if (item.method === 'post' ) { // post
      console.log(`${item.route} post`)
      set.post( item.route )

    }else { // getAll
      console.log(`${item.route} getAll`)
      set.get( item.route )

    }
  }*/

  for( let item of config.routes ){
    //setMethod( item )
    for( let method of item.methods) {
      const fields = item.fields ? ' '+item.fields.join(',') : ''

      let route = ( method === 'get' || method === 'delete' || method === 'put' )
      ? `${item.route}/:${item.key}`
      : item.route
      console.log( `api.set.${method} ${route} ${fields}`)
      item.fields ? set[method](item.route,item.fields) :  set[method](item.route)
    }
  }
  // for( let item of config.routes ) set[item.method](item.route,item.fields)
 })()


  const server = app.listen(8081, () => {
    console.log( 'Server listening on port 8081')
  })

})()
