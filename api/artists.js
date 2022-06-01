const express = require('express');
const artistRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const areRequired = (req, res, next) => {
    const artist = req.body.artist;
    if(!artist.name || !artist.dateOfBirth || !artist.biography) {
        return res.sendStatus(400);
    }
    if(!artist.isCurrentlyEmployed) {
        artist.isCurrentlyEmployed = 1;
    }
    req.artist = artist;
    next();
}

artistRouter.param('artistId', (req, res, next, id) => {
    db.get('SELECT * FROM Artist WHERE id = $id', {
        $id: id
    }, (err, row) => {
        if(err) {
            return next(err);
        }
        if(!row) {
            return res.sendStatus(404);
        }
        req.existingArtist = row;
        next();
    })
})

artistRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist \
    WHERE is_currently_employed = 1', (err, rows) => {
        if(err) {
            return next(err);
        }
        res.status(200).json({artists: rows});
    })
})

artistRouter.get('/:artistId', (req, res, next) => {
    res.status(200).json({artist: req.existingArtist});
})

artistRouter.post('/', areRequired, (req, res, next) => {
    const artist = req.artist;
    db.run('INSERT INTO Artist \
        (name, date_of_birth, biography, is_currently_employed) \
        VALUES ($name, $dob, $bio, $work)', {
        $name: artist.name,
        $dob: artist.dateOfBirth,
        $bio: artist.biography,
        $work: artist.isCurrentlyEmployed
    }, function(err) {
        if(err) {
            return next(err);
        }
        db.get('SELECT * FROM Artist \
            WHERE id = $id', {
                $id: this.lastID
            }, (err, row) => {
                if(err) {
                    return next(err);
                }
                res.status(201).json({artist: row});
            }
        )
    })
})

artistRouter.put('/:artistId', areRequired, (req, res, next) => {
    const artist = req.artist;
    db.run('UPDATE Artist \
        SET (name, date_of_birth, biography, is_currently_employed) \
        = ($name, $dob, $bio, $work) \
        WHERE id = $id', {
        $name: artist.name,
        $dob: artist.dateOfBirth,
        $bio: artist.biography,
        $work: artist.isCurrentlyEmployed,
        $id: req.params.artistId
    }, function(err) {
        if(err) {
            return next(err);
        }
        db.get('SELECT * FROM Artist \
            WHERE id = $id', {
                $id: req.params.artistId
            }, (err, row) => {
                if(err) {
                    return next(err);
                }
                res.status(200).json({artist: row});
            }
        )
    })
})

artistRouter.delete('/:artistId', (req, res, next) => {
    db.serialize(()=> {
        db.run('UPDATE Artist \
        SET (is_currently_employed) = ($work) \
        WHERE id = $id', {
            $work: 0,
            $id: req.params.artistId
        }, function(err) {
            if(err) {
                return next(err);
            }
        })
        db.get('SELECT * FROM Artist \
        WHERE id = $id', {
            $id: req.params.artistId
        }, (err, row) => {
            if(err) {
                return next(err);
            }
            res.status(200).json({artist: row});
        })
    })
})

module.exports = artistRouter;