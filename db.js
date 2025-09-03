// db.js
require("dotenv").config();
const { Pool, Client } = require("pg");

const config = {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
};
const pool = new Pool(config);
const createClient = () => new Client(config);

module.exports = {
  pool,
  createClient,
};
