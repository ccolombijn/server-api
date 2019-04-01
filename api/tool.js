'use strict'
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const generate = (function(){


  const config = () => {
    let configName;
    const configObj = {}
    const configRouteFields = (configRouteObj) => {
      rl.question('Add field: ', (field) => {
        if( field != '' ){
          configRouteObj.fields.push(field)
          configRouteFields(configRouteObj)
        }else{
          configObj.routes.push(configRouteObj)
          configRoute()
        }

      })
    }
    const configRoute = () => {
      let configRouteObj = {}
      rl.question('Route : ', (route) => {
        if( route != '' ){
          configRouteObj['route'] = route
        }else{
          return configFinalize()
        }
        rl.question('Key: ', (key) => {
          configRouteObj['key'] = key
          configRouteObj['methods'] = []
          rl.question('Add GET: ', (get) => {
            if( get === 'y' ) configRouteObj.methods.push('get')
            rl.question('Add GET all:', (getall) => {
              if( getall === 'y' ) configRouteObj.methods.push('getAll')
              rl.question('Add PUT: ', (put) => {
                if( put === 'y' ) configRouteObj.methods.push('put')
                rl.question('Add POST: ', (post) => {
                  if( post === 'y' ) configRouteObj.methods.push('get')
                  rl.question('Add DELETE: ', (del) => {
                    if( del === 'y' ) configRouteObj.methods.push('delete')

                    configRouteObj['fields'] = []
                    configRouteFields(configRouteObj)

                  })
                })
              })
            })
          })
        })
      })
    }
    const configFinalize = () =>{
      console.log( configObj )
      fs.writeFile(`./api/${configName}.json`, JSON.stringify(configObj, null, 2), function(err) {
        if(err) {
          return console.log(err);
        }

        console.log(`Saved config data to ./api/${configName}.json`);
      });
      rl.close();
    }
    const configDatabase = () =>{
      rl.question('Database host : ', (host) => {
        configObj.db['host'] = host
        rl.question('Database user : ', (user) => {
          configObj.db['user'] = user
          rl.question('Database password : ', (pass) => {
            configObj.db['password'] = pass
            rl.question('Database : ', (database) => {
              configObj.db['database'] = database
              configObj['routes'] = []
              configRoute()
            });
          });
        });
      });
    }
    rl.question('Name : ', (name) => {
      configName = name
      rl.question('API prefix : ', (prefix) => {
        configObj['prefix'] = prefix
        configObj['db'] = {}
        configDatabase()
      });
    });




  }

  return{
    config : config
  }
})()

const update = (function(){
  const config = () => {
    const configs = []
    const routes = []
    const directoryPath = path.join(__dirname, './');
    fs.readdir(directoryPath, function (err, files) {

      if (err) {
        return console.log('Unable to scan directory: ' + err);
      }else{
        console.log(`Current configs in ${directoryPath}`)
      }

      files.forEach(function (file) {
        // Do whatever you want to do with the file
        //if(file.includes('.json')) configs.push(file.replace('.json',''))
        if(file.includes('.json')) console.log(` - ${file.replace('.json','')}` )
      });
      let configName, configObj

      rl.question('Enter config to update : ', (name) => {
        configName = name
        configObj = JSON.parse(fs.readFileSync(`./api/${name}.json`, 'utf8'))
        configProps(name)

      });
    });




    const configProps = (name) => {
      rl.question(`Enter property to update from '${name}' (prefix, db, routes) : `, (prop) => {
        if(prop === 'routes'){
          configRoutes(name)
        }else if(prop === 'prefix'){
          configPrefix(name)
        }else if(prop === 'db'){
          configDb(name)
        }
      })
    }

    const configRoutes = (name) => {
      console.log( `Current routes in '${name}'`)
      for( let routeObj of configObj.routes ){
        console.log(`- ${routeObj.route}`)
        routes.push(routeObj.route)
      }

      rl.question('Enter route to update or new route to add: ', (route) => {
        if( routes.includes(route) ){
          rl.question(`Field to update from route '${route}' (route,key,methods,fields)`, (field) => {

          });
        }else{
          rl.question('Key: ', (key) => {

          });
        }
      });
    }

      const configPrefix = (name) =>{
        rl.question(`Update prefix (current : ${configObj.prefix}) :`, (prefix) => {
          if(prefix != '') configObj.prefix = prefix
          configProps(name)
        });
      }

      const configDb = (name) =>{
        rl.question(`Enter property to update from db (host, user, password, database):`, (prop) => {
          if(prop === 'host'){
            rl.question(`Update host (current : ${configObj.db.host}):`, (host) => {
              if(host != '') configObj.db.host = host
              configDb(name)
            })
          }else if (prop === 'user') {
            rl.question(`Update user (current : ${configObj.db.user}):`, (user) => {
              if(user != '') configObj.db.user = user
              configDb(name)
            })
          }else if (prop === 'password') {
            rl.question(`Update password (current : ${configObj.db.password}):`, (password) => {
              if(password != '') configObj.db.password = password
              configDb(name)
            })
          }else if (prop === 'database') {
            rl.question(`Update database (current : ${configObj.db.database}):`, (database) => {
              if(database != '') configObj.db.database = database
              configDb(name)
            })
          }else{

            configProps(name)

          }

        });
      }

  }
  return{
    config : config
  }
})()


const config = (function(){
  const modules = [
    { label : 'Generate', name : '-g', module : generate },
    { label : 'Update', name : '-u', module : update }
  ]

  return {
    modules : modules
  }
})()

const application = (function(){
  const run = ( endpoint ) => {
    if( !endpoint ) {
      endpoint = process.argv

    }
    if( isNode ) endpoint = endpoint.slice(2)
    let name = endpoint[0],
    action = endpoint[1],
    args = endpoint[2]
    console.log(config.modules)
    for( let module of config.modules ){
      if( module.name === name ){
        try{
          module.module[ action ]( args )
        }catch( error ){
          console.error( `${module.module}[ ${action} ](${args}) error : ${error}` )
        }
      }
    }
  },
  endpoint = (function(){
    let endpoint
    try {
      endpoint = location.hash.slice(1).split( '/' )
    }catch(error){
      endpoint = process.argv
    }
    return endpoint
  })(),
  isNode = (() => endpoint[0].includes( 'node' ))()
  let path = endpoint[1].split('\\')
  let pos = path.length-1

  if( isNode ){
    //const minimist = require('minimist')
    if( endpoint[2] ){
      run()
    }else{
      console.log( 'Please choose a module & method to run;' )
      for( let module of config.modules ){

        for( let method of Object.getOwnPropertyNames( module.module ) ){
          console.log( `${module.label} : node ${path[pos]} ${module.name} ${method}` )
        }
      }
    }
  }else{
    const output = document.querySelector( '#output' )
  }
  return {
    run : run,
    endpoint : endpoint,
    isNode : isNode
  }
})()
