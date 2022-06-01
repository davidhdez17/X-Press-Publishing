const express = require('express');
const sqlite3 = require('sqlite3');
const issuesRoute = express.Router({mergeParams: true});
const db = new sqlite3.Database('./database.sqlite');

issuesRoute.param('issueId', (req, res, next, id) => {

    db.get(`SELECT * FROM Issue WHERE id = ${id}`, (err, row) => {

        if(err) {
            return next(err);
        } else if (!row) {
            return res.sendStatus(404);
        } else {
            req.issue = row;
            next();
        }
    })
})


issuesRoute.get('/', (req, res, next) => {

    db.all('SELECT * FROM Issue WHERE series_id = $id',{ 
        $id: req.params.seriesId
    }, (err, rows) => {

        if(err) {
            return next(err);
        } else {
            return res.status(200).send({ issues: rows });
        }
    })
})

issuesRoute.post('/', (req, res, next) => {

    const issue = req.body.issue;
    
    if(!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId) {
        return res.sendStatus(400);
    }

    db.get('SELECT * FROM Artist WHERE id = $id', {
        $id: issue.artistId
    }, (err, row) => {
        if(err){
            return next(err);
        } else if(!row){
            return res.sendStatus(400);
        } else {
            
            db.run('INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) \
            VALUES ($name, $issue, $pub, $artist, $series)', {
                $name: issue.name,
                $issue: issue.issueNumber,
                $pub: issue.publicationDate,
                $artist: issue.artistId,
                $series: req.params.seriesId
            }, function (err) {
                if(err) {
                    return next(err);
                } else {

                    db.get('SELECT * FROM Issue WHERE id = $lastId', {
                        $lastId: this.lastID
                    },  (err, row) => {
                        if(err) {
                            return next(err);
                        } else {
                            return res.status(201).send({ series: row })
                        }
                    })
                }
            })
        }
    })
})

issuesRoute.put('/:issueId', (req, res, next) => {
    
    const issue = req.body.issue;
    
    if(!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId) {
        return res.sendStatus(400);
    }

    db.get('SELECT * FROM Artist WHERE id = $id', {
        $id: issue.artistId
    }, (err, row) => {
        if(err){
            return next(err);
        } else if(!row){
            return res.sendStatus(400);
        } else {
            
            db.run('UPDATE Issue SET (name, issue_number, publication_date, artist_id) \
            = ($name, $issue, $pub, $artist) WHERE id = $issueId', {
                $name: issue.name,
                $issue: issue.issueNumber,
                $pub: issue.publicationDate,
                $artist: issue.artistId,
                $issueId: req.params.issueId
            }, function (err) {
                if(err) {
                    return next(err);
                } else {

                    db.get('SELECT * FROM Issue WHERE id = $id', {
                        $id: req.params.issueId
                    },  (err, row) => {
                        if(err) {
                            return next(err);
                        } else {
                            return res.status(200).send({ issue: row })
                        }
                    })
                }
            })
        }
    })
})

issuesRoute.delete('/:issueId', (req, res, next) => {

    db.run('DELETE FROM Issue WHERE id = $issueId', {
        $issueId: req.params.issueId
    }, function (err) {

        if(err) {
            return next(err);
        } else {
            return res.sendStatus(204);
        }
    })
})

module.exports = issuesRoute;