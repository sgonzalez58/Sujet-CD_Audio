// const { Pool } = require("pg")
const { pool } = require("../configs/db");
const request = require('supertest');

const express = require("express");
const cors = require("cors");
const cdRoutes = require("../Routes/cdRoutes");

// const app = require('../server')

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", cdRoutes);

require('dotenv').config()
jest.setTimeout(30000)
// let pool
describe('Test de la base de donnée - unitaire', () => {
    beforeAll(async () => {
    //     const connectionString = process.env.URI_DB
    //     console.log("test con is = ",connectionString)
    //     pool = new Pool({ connectionString })
    // Ouvre un 2nd pool ( spécifique à jest )

    await pool.query(`CREATE TABLE IF NOT EXISTS cds (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL
    );`);
    })

    afterEach(async () => {
        await pool.query('DELETE FROM cds')
    })

    test('Doit retourner la table cds', async () => {     

        const result = await pool.query("SELECT * FROM cds ORDER BY id ASC");

        expect(result.rows.length).toEqual(0)
    })

    test('Doit retourner le cd ajouté', async () => {     

        const result = await pool.query(
            "INSERT INTO cds (title, artist, year) VALUES ($1, $2, $3) RETURNING *",
            ['Closer','Chainsmokers','2017']
            );

        expect(result.rows[0]).toEqual(expect.objectContaining({title: 'Closer', artist: 'Chainsmokers', year: 2017}))

        const result2 = await pool.query(
            "INSERT INTO cds (title, artist, year) VALUES ($1, $2, $3) RETURNING *",
            ['Die For You','The Weeknd','2016']
            );

        expect(result2.rows[0]).toEqual(expect.objectContaining({title: 'Die For You', artist: 'The Weeknd', year: 2016}))
    })

    test('Doit retourner une erreur', async () => {     

        await expect(pool.query(
            "INSERT INTO cds (title, artist) VALUES ($1, $2) RETURNING *",
            ['Closer','Chainsmokers']
        )).rejects.toThrow(/year/)

        await expect(pool.query(
            "INSERT INTO cds (title, artist, year) VALUES ($1, $2, $3) RETURNING *",
            ['Die For You','The Weeknd','arthur']
        )).rejects.toThrow(/integer/)

        await expect(pool.query(
            "INSERT INTO cds (title, artist, year) VALUES ($1, $2, $3) RETURNING *",
            ['Closer','Chainsmokers', [2016]]
        )).rejects.toThrow(/integer/)

        await expect(pool.query(
            "INSERT INTO cds (title, artist, year) VALUES ($1, $2, $3) RETURNING *",
            ['Die For You','The Weeknd',{year: 'arthur'}]
        )).rejects.toThrow(/integer/)
    })
})

describe('cdController - Intégration', () => {
    beforeAll(async () => {
    //     const connectionString = process.env.URI_DB
    //     console.log("test con is = ",connectionString)
    //     pool = new Pool({ connectionString })
        // Ouvre un 2nd pool ( spécifique à jest )

        await pool.query(`CREATE TABLE IF NOT EXISTS cds (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            artist VARCHAR(255) NOT NULL,
            year INTEGER NOT NULL
        );`);
    })

    // afterAll(async () => {
    //     await pool.query(`DROP TABLE "cds"`)
    //     await pool.end()
    //     // Ferme le 2nd pool ( spécifique à jest )
    // })

    afterEach(async () => {
        await pool.query('DELETE FROM cds')
    })

    describe('Ajoute un CD à la liste actuelle', () => {

        test("Doit retourner une liste vide", async function() {

            const response = await request(app)
                .get('/api/cds')
            expect(response.status).toEqual(200)
            expect(response.body).toEqual([])
        });
        
        test("Doit retourner le CD ajouté", async function() {
            const response = await request(app)
                .post('/api/cds')
                .send({title: 'Closer', artist: 'Chainsmokers', year: '2017'})
                .set('Content-Type', 'application/json')
            
            expect(response.headers['content-type']).toMatch(/json/)
            expect(response.status).toEqual(201)
            expect(response.body).toEqual(expect.objectContaining({title: 'Closer', artist: 'Chainsmokers', year: 2017}))

            const response2 = await request(app)
                .post('/api/cds')
                .send({title: 'Die For YouCloser', artist: 'The Weeknd', year: '2016'})
                .set('Content-Type', 'application/json')
            
            expect(response2.headers['content-type']).toMatch(/json/)
            expect(response2.status).toEqual(201)
            expect(response2.body).toEqual(expect.objectContaining({title: 'Die For YouCloser', artist: 'The Weeknd', year: 2016}))
        });

        test("Doit retourner un liste vide", async function() {
            const response = await request(app)
                .post('/api/cds')
                .send({title: 'Closer', artist: 'Chainsmokers', year: '2017'})
                .set('Content-Type', 'application/json')
            
            await request(app)
                .delete('/api/cds/' + response.body.id)

            const response2 = await request(app)
                .get('/api/cds')

            expect(response2.status).toEqual(200)
            expect(response2.body).toEqual([])

            const response3 = await request(app)
                .post('/api/cds')
                .send({title: 'Closer', artist: 'Chainsmokers', year: '2017'})
                .set('Content-Type', 'application/json')
            
            await request(app)
                .delete('/api/cds/' + response3.body.id)

            const response4 = await request(app)
                .get('/api/cds')

            expect(response4.status).toEqual(200)
            expect(response4.body).toEqual([])
        });

        test("Doit retourner une erreur", async function() {
            const response = await request(app)
                .get('/api/cds')
                .send({title: 'Closer', artist: 'Chainsmokers', year: '2017'})
                .set('Content-Type', 'application/json')

            expect(response.status).toEqual(200)
            
            const response2 = await request(app)
                .delete('/api/cds/chien' )

            expect(response2.status).toEqual(500)

            const response3 = await request(app)
                .post('/api/cds')
                .set('Content-Type', 'application/json')

            expect(response3.status).toEqual(500)
        });
    })
})