const express = require('express');
const sqlite3 = require('sqlite3');
const seriesRoute = express.Router();
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const issuesRouter = require('./issues');

seriesRoute.use('/:seriesId/issues', issuesRouter);

const isRequired = (req, res, next) => {

    if(!req.body.series.name || !req.body.series.description) { return res.sendStatus(400) }
    next();
}

seriesRoute.param('seriesId', (req, res, next, id) => {

    db.get(`Select * FROM Series WHERE id = ${id}`, (err, row) => {

        if(err) { return next(err) }
            else if(!row) { return res.sendStatus(404); }
            else { req.series = row }

        next();

    })
})

seriesRoute.get('/', (req, res, next) => {
    
    db.all('SELECT * FROM Series', (err, rows) => {

        err ? next(err) : res.status(200).send({series: rows}); 

    })
})

seriesRoute.get('/:seriesId', (req, res, next) => {

    res.status(200).send({series: req.series});

})

seriesRoute.post('/', isRequired, (req, res, next) => {

    db.run('INSERT INTO Series (name, description)\
        VALUES ($name, $description)', {
            $name: req.body.series.name,
            $description: req.body.series.description
        }, function(err) {

            if(err) { return next(err); }
            db.get(`SELECT * FROM Series WHERE id = $lastId`, {
                $lastId: this.lastID }, (err, row) => {

                if(err) { return next(err); }
                    else { res.status(201).json({ series: row }); }
            })
    })
})

seriesRoute.put('/:seriesId', isRequired, (req, res, next) => {

    db.serialize( () => {

        db.run('UPDATE Series SET (name, description) = ($name, $description) \
        WHERE id = $id', {
            $name: req.body.series.name, 
            $description: req.body.series.description,
            $id: req.series.id
        }, function(err) {
            if(err) { return next(err); }
    })

        db.get('SELECT * FROM Series WHERE id = $id', {
            $id: req.series.id
        }, (err, row) => {
            if(err) { return next(err); }
                else { res.status(200).json({ series: row }); }
        })
    })
})

seriesRoute.delete('/:seriesId', (req, res, next) => {

    db.all('SELECT * FROM Issue WHERE series_id = $seriesId', {
        $seriesId: req.params.seriesId
    }, (err, rows) => {
        if(err) { return next(err); }
            else if(rows[0]) {
                console.log(rows[0]);
                return res.sendStatus(400);
            } else {

                db.run('DELETE FROM Series WHERE id = $seriesId', {
                    $seriesId: req.params.seriesId
                }, function(err) {
                    if(err) { return next(err); }
                        else { return res.sendStatus(204); }
                })
            }
    })
})

module.exports = seriesRoute;