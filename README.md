# README.MD serverlib

## Intro

This library makes it easy to create a RESTful API.
To use it you need to supply database coordinates and a representation
(as Node object)
of the structure of you API.

## Synopsis

```
const Server = require('./serverlib.js');

const db_parms = {
  host: 'myhost',
  user: 'myusername',
  password: 'mypassword',
  database: 'mydatabase',
  port: '8081',
  verbose: 1
};

const routing =  {
  'dogs': { crud: 'CRD' },
  'dogowners': { crud: 'CRUDcrud', fields: ['name', 'address']},
  'config': { transparent: 1, children: {
    'foo': { crud: 'CRUDcrud', fields: [ 'x', 'y'], children: {
        'zoo': { crud: 'CRUDcrud' },
        'bee': { crud: 'CRUDcrud' }
      }},
    'bar': { crud: 'CRD' }
  }},
  'diag': { proc: q=>`show tables`}
  'apply': { form: q=>`show tables`}
};

const server = new Server(db_parms, routing);
```

The code above results in the following API:

| URL     | Method | Db Table accessed    |
| :------------- | :------------- | :--------------|
| myhost:8081/api/dogs       | POST |  dogs {json} |
| myhost:8081/api/dogs       | GET |  dogs |
| myhost:8081/api/dogs       | DELETE |  dogs |
| myhost:8081/api/dogowners       | POST |  dogowners {json} |
| myhost:8081/api/dogowners       | GET |  dogowners |
| myhost:8081/api/dogowners       | PUT |  dogowners {json}|
| myhost:8081/api/dogowners       | DELETE |  dogowners[id] |
| myhost:8081/api/dogowners/:id      | POST |  dogowners[id] {json} |
| myhost:8081/api/dogowners/:id       | GET |  dogowners[id] |
| myhost:8081/api/dogowners/:id       | PUT |  dogowners[id] {json}|
| myhost:8081/api/dogowners/:id       | DELETE | dogowners[id] |
| myhost:8081/api/config       | -- |  none. 'config' serves only to categorise routes, as does not itself have a baring on the database |
| myhost:8081/api/config/foo       | POST |  foo {json} |
| myhost:8081/api/config/foo       | GET |  foo |
| myhost:8081/api/config/foo       | PUT |  foo {json}|
| myhost:8081/api/config/foo       | DELETE |  foo[id] |
| myhost:8081/api/config/foo/:id      | POST |  foo[id] {json} |
| myhost:8081/api/config/foo/:id       | GET |  foo[id] |
| myhost:8081/api/config/foo/:id       | PUT |  foo[id] {json}|
| myhost:8081/api/config/foo/:id       | DELETE |  foo[id] |
| myhost:8081/api/config/foo/zoo       | POST |  foo -> zoo {json} (foo has a foreign key pointing to zoo via id) |
| myhost:8081/api/config/foo/zoo       | GET |  foo -> zoo |
| myhost:8081/api/config/foo/zoo       | PUT |  foo -> zoo {json}|
| myhost:8081/api/config/foo/zoo       | DELETE |  foo -> zoo[id] |
| myhost:8081/api/config/foo/zoo/:id      | POST |  foo -> zoo[id] {json} |
| myhost:8081/api/config/foo/zoo/:id       | GET |  foo -> zoo[id] |
| myhost:8081/api/config/foo/zoo/:id       | PUT |  foo -> zoo[id] {json}|
| myhost:8081/api/config/foo/zoo/:id       | DELETE |  foo -> zoo[id] |
| " | " | " |
| myhost:8081/api/diag | GET | function determines query |
| myhost:8081/api/apply | POST | function determines query |

## Syntax of the routing Object

The routing object determines the URL routes and the effects on the database.
Each URL gets prepended with the pattern: __hostname__, ':',  __port__, '/api'.
The routing object has attributes that refer to path elements. The structure
is recursive, if a route has __children__. Each path element attribute has a value
which is itself an object. The following attributes may occur in such object:

+ crud: string containing the zero or more occurrences of the letter c,r, u and d, in lower or upper case. Upper case letters trigger the creation of crud-operations on the table as a whole, lower case ones on the indexed individual rows.
+ fields: array of column names (except 'id'). These are needed in order to realize the update method.
+ children: The present table has a foreign key. Within the children value we describe partial routes to operate on the refered table via this foreign key.
+ proc: a function describes a special operation. The parameter is asscociated with an object containing all parameters. For example, if 'diag' has a proc attribute, the URL
__myhost:8081/api/diag?three=3&blind=visimpaired&mice=rodents__
is converted into a call of the diag proc with one parameter: {three:3, blind:"visimpaired", mice: "rodents"}. Example use:

'fund_per_bank': { proc: q=>`select * from funds where bank_fk = (select id from dataprovider where abbrev = '${q.bank}')`},


+ form: this is like proc, but uses POST to create a new database object. This is intended for forms and questionnaires.

## Bugs and limitations

Not yet thoroughly tested.
form attribute not implemented yet.

## AUTHOR

Written by Theo van den Heuvel (Van den Heuvel HLT Consultancy), making substantial use of code written by Raymond Loman (Carpago)
