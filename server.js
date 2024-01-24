const express = require("express");
const clientSessions = require("client-sessions");
const legoData = require("./modules/legoSets");
const authData = require("./modules/auth-service");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(clientSessions({
    cookieName:'session',
    secret: process.env.SESSION_SECRET,
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60 
}));
app.use((req, res, next) => {
    res.locals.session = req.session;next();
});

app.set("view engine", "ejs");

function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect('/login');
    } else {
      next();
    }
}

app.get("/", (req,res) => {
    res.render("home");
});

app.get("/about", (req,res) => {
    res.render("about")
});

app.get("/lego/sets", async (req, res) => {
    try {
        if(req.query.theme) {
            let setData = await legoData.getSetsByTheme(req.query.theme);
            res.render("sets", { sets: setData });

        } else {
            let allSets = await legoData.getAllSets();
            res.render("sets", { sets: allSets });
        }
    } catch(err) {
        res.status(404).render("404", { message: "No Sets found for a matching theme" });
    }
});

app.get("/lego/sets/:setNum", async (req, res) => {
    try {
        let setData = await legoData.getSetByNum(req.params.setNum);
        if(setData.length != 0) {
            res.render("set", { set: setData});
        }
    } catch(err) {
        res.status(404).render("404", { message: "Unable to find requested set" });
    }
});

app.get("/lego/addSet", ensureLogin, async (req, res) => {
    let themeData = await legoData.getAllThemes();
    res.render("addSet", {themes:themeData})
});

app.post("/lego/addSet", ensureLogin, async(req, res) => {
    try {
        await legoData.addSet(req.body);
        res.redirect("/lego/sets")
    } catch(err) {
        res.render("500", {message: `Internal Server Error: ${err}`})
    }
});

app.get("/lego/editSet/:setNum", ensureLogin, async (req, res) => {
    try {
        let setData = await legoData.getSetByNum(req.params.setNum);
        let themeData = await legoData.getAllThemes();

        res.render("editSet", {themes: themeData, set: setData});
    } catch(err) {
        res.status(404).render("404", {message:err});
    }
});

app.post("/lego/editSet", ensureLogin, async (req, res) => {
    try {
        await legoData.editSet(req.body.set_num, req.body);
        res.redirect("/lego/sets");
    } catch(err) {
        res.render("500", {message: `Internal Server Error: ${err}`})
    }
});

app.get("/lego/deleteSet/:setNum", ensureLogin, async(req, res) => {
    try {
        await legoData.deleteSet(req.params.setNum);
        res.redirect("/lego/sets");
    } catch(err) {
        res.render("500", {message: `Internal Server Error: ${err}`});
    }
});

app.get("/login", (req, res) => {
    res.render("login", {errorMessage: '',  username: ''});
});

app.get("/register", (req, res) => {
    res.render("register", {errorMessage: '',  username: '', successMessage:''});
});

app.post("/register", async(req, res) => {
    try {
        await authData.registerUser(req.body);
        res.render("register",{successMessage: "User created", errorMessage: ''});
    } catch(err) {
        res.render("register",{errorMessage: err, userName: req.body.userName, successMessage:''});
    }
})

app.post("/login", async(req, res) => {
    try {
        req.body.userAgent = req.get('User-Agent');
        let user = await authData.checkUser(req.body)

        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        };

        res.redirect("/lego/sets");
    } catch(err) {
        res.render("login", {errorMessage: err, username: req.body.userName});
    }
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
})

app.use((req, res) => {
    res.status(404).render("404", { message: "No view matched for a specific route" });
});

legoData.initialize().then(authData.initialize).then(()=>{
    app.listen(HTTP_PORT, () => {
        console.log(`server listening on: ${HTTP_PORT}`);
    });
}).catch(err => {
    console.log(`an error occured: ${err}`)
});
