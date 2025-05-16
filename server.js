if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');

const initializePassport = require('./passport-config');
const USER_FILE = 'users.json'

initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))


app.get('/', checkAuthenticated, (req, res) => {
  res.redirect('calendar');
});

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login');
});

app.post(
  '/login',
  checkNotAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/calendar',
    failureRedirect: '/login',
    failureFlash: true,
  })
);

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try{
        users = loadUsers();
        const existing = users.find(u => u.email === req.body.email)
        if (existing){
            req.flash('error', 'Email already in use')
            return res.redirect('/register')
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const newUser = {
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        }

        users.push(newUser)
        saveUsers(users)
        res.redirect('/login')
    }
 
    catch (err) {
        console.log(err)
        res.redirect('/register');
    }
});

app.delete('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
});


app.get('/calendar', checkAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calendar.html'));
});

app.get('/events', checkAuthenticated, (req, res) => {
  fs.readFile('events.json', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Could not read events' });
    }
    res.json(JSON.parse(data));
  });
});

app.post('/events', checkAuthenticated, (req, res) => {
  const events = req.body;
  fs.writeFile('events.json', JSON.stringify(events, null, 2), err => {
    if (err) {
      return res.status(500).json({ error: 'Could not save events' });
    }
    res.json({ message: 'Events saved!' });
  });
});


function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

function loadUsers(){
    try{
        const data = fs.readFileSync(USER_FILE, 'utf-8')
        return JSON.parse(data)
    }
    catch(err){
        return [];
    }
}

function saveUsers(users){
    fs.writeFileSync(USER_FILE, JSON.stringify(users, null, 2));
}


let users = loadUsers();
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
