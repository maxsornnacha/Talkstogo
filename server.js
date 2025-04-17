const  express = require('express');
const app = express();
//import middlewares
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const bodyParser = require('body-parser');
//import dataBase
const mongoose = require('mongoose');
//import Router 
const router = require('./routers/router');
//import session
const session = require('express-session');
//Refis
const RedisStore = require("connect-redis").default
const { createClient } = require('redis');


//เชื่อมต่อ mongoose
mongoose.connect(process.env.DATABASE)
.then(()=>{
    console.log(`mongoDB database has been connected to this server !`)
})
.catch((error)=>{
    console.log('error to connect to the database, the reason is as followed :',error)
});


//middleware
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '5mb' })); // Use body-parser for JSON with increased limit
app.use(express.json());


const corsOptions = {
    origin: [process.env.CLIENT_URL , process.env.CLIENT_URL_1],
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Initialize client to dataBase
let redisClient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        
    }
});

//Connect redis client
redisClient.connect()
.then(()=>{
  console.log('Redis client connected')
})
.catch((error)=>{
  console.error(error)
})

// Initialize store.
let redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp:",
})

//Redis connection to session and configure session middleware
app.use(
  session({
    secret: 'JBJBFJHDBHJDBHJFBKSBSJLKDBSJKFBSJ',
    store: redisStore,
    resave: false, // required: force lightweight session keep alive (touch)
    saveUninitialized: false, // recommended: only save session when data exists
    cookie:{
      secure: process.env.NODE_ENV === 'production', // only transmit cookie over https
      maxAge: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
      sameSite: 'none'
    }
  })
);


if(process.env.NODE_ENV === 'production'){
   app.set('trust proxy', 1); // trust first proxy
}


app.use(router);


const port = process.env.PORT || 5500

app.listen(port ,()=>{
  console.log(`port main server running on ${port}`)
  console.log(`client url : ${process.env.CLIENT_URL}`)
  console.log(`client url 1 : ${process.env.CLIENT_URL_1}`)
  console.log(`this server is running for ${process.env.NODE_ENV}`)
  console.log(`production confirmation : ${process.env.NODE_ENV === 'production'}`)

});
