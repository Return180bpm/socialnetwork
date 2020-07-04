const express = require("express");
const app = express();
const compression = require("compression");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

// Handlers for database stuff
const db = require("./db.js");
// Handlers for bcrypt stuff
const bc = require("./bc.js");

const {
    requireLoggedInUser,
    requireLoggedOutUser,
    requireNoSignature,
    requireSignature,
} = require("./routeMiddleware.js");

app.use(compression());
app.use(
    cookieSession({
        secret: `Let's be backrooms shining dollardollarbillyo.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);
app.use(
    express.urlencoded({
        extended: false,
    })
);
//  app.use(csurf());
app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    // res.locals.csrfToken = req.csrfToken();
    res.locals.user = req.session.user;
    next();
});
// app.use(requireLoggedInUser);
app.use(express.json());
app.use(express.static("./public"));

// app.use(requireLoggedInUser);

if (process.env.NODE_ENV != "production") {
    app.use(
        "/bundle.js",
        require("http-proxy-middleware")({
            target: "http://localhost:8081/",
        })
    );
} else {
    app.use("/bundle.js", (req, res) => res.sendFile(`${__dirname}/bundle.js`));
}

app.get("/welcome", (req, res) => {
    if (req.session.userId) {
        // if the user is logged in...
        res.redirect("/");
    } else {
        // the user is NOT logged in...
        res.sendFile(__dirname + "/index.html");
    }
});

app.get("*", function (req, res) {
    if (!req.session.userId) {
        res.redirect("/welcome");
    } else {
        res.sendFile(__dirname + "/index.html");
    }
});
app.post("/register", (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    bc.makeHash(password)
        .then((hashedPw) => {
            return db.addUser(firstName, lastName, email, hashedPw);
        })
        .then((rows) => {
            // console.dir(rows);
            // console.log(JSON.stringify(rows, null, 4));

            const { id: userId } = rows[0];

            req.session = { userId, firstName, lastName };
            res.send(rows);
        })
        .catch((err) => {
            console.log("Error in POST /register\n", err);
            res.sendStatus(500);
        });
});

app.listen(8080, function () {
    console.log("social network server is listening on 8080.");
});
