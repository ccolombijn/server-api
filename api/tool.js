'use strict'
const fs = require('fs')
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const generate = (function(){
  const config = () => {
    let configName;
    const configObj = {}
    rl.question('Name : ', (name) => {
      configName = name
      rl.question('API prefix : ', (prefix) => {
        configObj['prefix'] = prefix
        configObj['db'] = {}
        rl.question('Database host : ', (host) => {
          configObj.db['host'] = host
          rl.question('Database user : ', (user) => {
            configObj.db['user'] = user
            rl.question('Database password : ', (pass) => {
              configObj.db['password'] = pass
              rl.question('Database : ', (database) => {
                configObj.db['database'] = database
                console.log( configObj )
                rl.close();
              });
            });
          });
        });
      });
    });




  }

  return{
    config : config
  }
})()



const config = (function(){
  const modules = [
    { label : 'Generate', name : '-gen', module : generate }
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