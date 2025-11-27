const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// General rate limiting to all routes
app.use(generalLimiter);

// Helpers available to all views
const { formatCurrency, formatNumber, formatDate } = require('./utils/helpers');
const { SIMULATION_DEFAULTS } = require('./config/constants');
app.locals.formatCurrency = formatCurrency;
app.locals.formatNumber = formatNumber;
app.locals.formatDate = formatDate;
app.locals.locale = SIMULATION_DEFAULTS.LOCALE;
app.locals.currency = SIMULATION_DEFAULTS.CURRENCY;

app.use('/', indexRouter);
app.use('/admin', adminRouter);

app.use((req, res) => {
    res.status(404).render('404', { title: 'Not found' });
});

app.use(errorHandler);

module.exports = app;
