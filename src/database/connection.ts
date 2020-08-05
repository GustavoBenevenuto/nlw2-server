import knex from 'knex';
import path from 'path';
import Knex from 'knex';

const db = Knex({
    client: 'sqlite3',
    connection: {
        filename: path.resolve(__dirname, 'database.sqlite'),
    },
    useNullAsDefault: true,
});

//useNullAsDefault: true, usa só no sql pois ele n sabe como preencher os valores null

export default db;