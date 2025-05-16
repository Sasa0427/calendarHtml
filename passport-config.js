const { authenticate } = require('passport')
const bcrypt = require('bcrypt')
const fs = require('fs')

const LocalStrategy = require('passport-local').Strategy

function initialize(passport, getUserByEmail, getUserById){
    const authenticateUser = async (email, password, done) => {
       const user = getUserByEmail(email)
       if (user == null) {
        return done(null, false, {message: 'Invalid credentials'})
       }
       try{
        if (await bcrypt.compare(password, user.password)){
            return done(null, user)
        }
        else{
            return done(null, false, {message: 'Invalid credentials'})
        }
       }
       catch(e){
        return done(e)
       }
    }
    passport.use(new LocalStrategy({usernameField: 'email'}, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        fs.readFile('users.json', 'utf-8', (err, data) => {
            if (err) return done(err);

            const users = JSON.parse(data)
            const user = users.find(user => user.id === id)
            return done(null, user)
        })
     } )
}

module.exports = initialize