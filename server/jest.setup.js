const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const dotenv = require('dotenv');

dotenv.config();

let containerpg;
let connectionString;

beforeAll(async () => {
    containerpg = await new PostgreSqlContainer()
        .withDatabase('cd_database')
        .start();
    
    connectionString = containerpg.getConnectionUri();
    console.log("connection PG : ", connectionString);
    process.env.URI_DB = connectionString;
});

afterAll(async () => {
    await containerpg.stop();
});