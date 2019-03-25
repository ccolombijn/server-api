const Server = require('./serverlib.js');

// based on code by Carpago for Spectrum SE Track

// TODO: add list of operations we want to create requests for

"use strict";

const db_parms = {
  host: 'localhost',
  user: 'root',
  password: 'wortel',
  database: 'inphykem',
  port: '8081',
  verbose: 0
};

const routing =  {
   'config': { transparent: 1, children: {
     'assetcategorygroup': { fields: ['name', 'abbrev'], crud: 'CRUD'},
     'assetcategory': { fields: ['name', 'abbrev', 'assetcatgroup_fk'], crud: 'CRUD'},
     'assetsubcategory': { fields: ['name', 'abbrev', 'assetcat_fk'], crud: 'CRUD'},
     'dataprovider': { fields: ['name', 'abbrev', 'details', 'is_external_manager'], crud: 'CRUD'},
     'funds': { fields: ['fund', 'account', 'dataprovider_fk', 'assetsubcategory_fk'], crud: 'CRUD'},
     'subfunds': { fields: ['externalname', 'internalname', 'fund_fk', 'tradable'], crud: 'CRUD'},
   }},
   'holdings': { transparent: 1, children: {
     'units': { fields: [], crud: 'CRUD'},
     'prices': { fields: [], crud: 'CRUD'},
      //  'asset-benchmarks': { fields: [], crud: 'CRUD'},
      //  'asset-mix': { fields: [], crud: 'CRUD'},
      //  'asset-mix-vs-strategic-benchmark': { fields: [], crud: 'CRUD'},
      //  'assets': { fields: [], crud: 'CRUD'},
      //  'asset-value-summary-table': { fields: [], crud: 'CRUD'},
      //  'delta-weights': { fields: [], crud: 'CRUD'},
      //  'invested-capital': { fields: [], crud: 'CRUD'},
      //  'norm-portfolio': { fields: [], crud: 'CRUD'},
      //  'performance-monthly': { fields: [], crud: 'CRUD'},
      //  'planned-trades-summary': { fields: [], crud: 'CRUD'},
      //  'portfolio': { fields: [], crud: 'CRUD'},
      //  'portfolio-summary': { fields: [], crud: 'CRUD'},
      //  'strategic-benchmark': { fields: [], crud: 'CRUD'},
      //  'trades': { fields: [], crud: 'CRUD'},
      //  'trade-request': { fields: [], crud: 'CRUD'},
      'fund_per_bank': { proc: q=>`select * from funds where dataprovider_fk = (select id from dataprovider where abbrev = '${q.bank}')`},
      'xyzzy': { proc: q=>'select 42'},
      'zyzzy': { proc: q=>'select "AAP"'}
   }},
   'process': { transparent: 1, children: {
     'signals': { crud: 'CRD'}
   }}
};

const server = new Server(db_parms, routing);
