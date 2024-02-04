const express = require('express')
const app = express();

const hbs = require('express-handlebars');
const path = require('path');

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'hbs');
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultView : 'default',
    layoutsDir : path.join(__dirname , 'views')
}))

app.get('/', (req, res) => {
    res.render('main');
});

app.listen(3000, () => console.log('Server is stated on http://localhost:3000'));