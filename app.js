require("dotenv-flow").config();
const cors = require("cors");
const http = require("http");
const express = require("express");
const passport = require("passport");
const RedisStore = require("connect-redis").default;
const Redis = require("ioredis");
const expressSession = require("express-session");
const { Strategy: LocalStrategy } = require("passport-local");
const { Server } = require("ws");
const helmet = require("helmet");
const { csrfSync } = require("csrf-sync");

const { generateToken, csrfSynchronisedProtection } = csrfSync();

const client = new Redis({
  host: process.env.REDIS_SESSION_HOST,
  port: process.env.REDIS_SESSION_PORT,
  password: process.env.REDIS_SESSION_PASSWORD,
  db: process.env.REDIS_SESSION_DB,
});

const store = new RedisStore({ client });

const loggedInUser = {
  userId: 1,
  userName: process.env.TEST_USER_EMAIL,
  isAdmin: false,
};

const sessionParser = expressSession({
  secret: process.env.SESSION_SECRET,
  resave: process.env.SESSION_RESAVE === "true",
  rolling: process.env.SESSION_ROLLING === "true",
  saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED === "true",
  cookie: {
    httpOnly: process.env.SESSION_HTTP_ONLY === "true",
    // Doesnt work if maxAge is not of type Number
    maxAge: +process.env.SESSION_MAX_AGE,
    // https://stackoverflow.com/questions/61999068/how-do-i-use-cookies-in-express-session-connect-sid-will-soon-be-rejected
    // https://github.com/jaredhanson/passport-twitter/issues/101
    sameSite: process.env.SESSION_SAME_SITE,
    secure: process.env.SESSION_SECURE === "true",
  },
  store,
});

const app = new express();

app.use(
  cors({
    origin: [
      "127.0.0.1",
      "http://127.0.0.1",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3000/",
      "http://127.0.0.1:8000",
      "http://127.0.0.1:8000/",
      "http://frontend.chapi.local:3000",
      "http://frontend.chapi.local:3000/",
      "http://backend.chapi.local:8000",
      "http://backend.chapi.local:8000/",
      "http://localhost",
      "http://localhost:3000",
      "http://localhost:3000/",
      "http://localhost:8000",
      "http://localhost:8000/",
      "localhost",
    ],
    credentials: true,
  })
);

// https://github.com/SoftwareBrothers/adminjs/issues/607#issuecomment-693621747
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        frameAncestors: ["'self'", "https://www.recaptcha.net"],
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        imgSrc: [
          "'self'",
          "data:",
          "https://imagine.ai",
          "https://www.imagine.ai",
        ],
      },
    },
    referrerPolicy: {
      policy: "same-origin",
    },
  })
);

passport.serializeUser((user, done) => {
  done(null, user.userId);
});
passport.deserializeUser(async (userId, done) => {
  done(null, loggedInUser);
});

passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      badRequestMessage: "email or password is missing",
    },
    async (email, password, done) => {
      if (
        email === process.env.TEST_USER_EMAIL &&
        password === process.env.TEST_USER_PASSWORD
      ) {
        return done(null, loggedInUser);
      } else {
        return done(null, false);
      }
    }
  )
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sessionParser);
app.use(passport.initialize());
app.use(passport.session());

app.get("/user", (req, res) => {
  return res.json(req.user);
});

app.get("/csrf/token", (req, res) => {
  req.session.test = 'abracadabra';
  return res.json({ token: generateToken(req) });
});

app.get("/session/token", (req, res) => {
  return res.json({ token: req.session.csrfToken, test: req.session.test });
});

app.post("/login", csrfSynchronisedProtection, (req, res, next) => {
  passport.authenticate("local", {}, async (error, user, info) => {
    if (error) {
      return next(error);
    }
    if (!user) {
      return res.json(false);
    }
    req.logIn(user, (error) => {
      if (error) {
        return next(error);
      }
      return res.json(user);
    });
  })(req, res, next);
});

app.post("/logout", (req, res, next) => {
  req.logout();
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    req.user = null;
    res.clearCookie("connect.sid");
    return res.json(true);
  });
});

const map = new Map();

const server = http.createServer(app);

const websocketServer = new Server({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  sessionParser(request, {}, () => {
    console.log(
      request.session,
      request.user,
      request.session.user,
      request.headers.cookie
    );

    websocketServer.handleUpgrade(request, socket, head, function (ws) {
      websocketServer.emit("connection", ws, request);
    });
  });
});

websocketServer.on("connection", function (ws, request) {
  const user = request.session.user;

  map.set(user, ws);

  ws.on("message", function (message) {
    //
    // Here we can now use session parameters.
    //
    console.log(`Received message ${message} from user ${user}`);
  });

  ws.on("close", function () {
    map.delete(user);
  });
});

server.listen(+process.env.PORT, () =>
  console.log(`server listening on ${process.env.PORT}`)
);
