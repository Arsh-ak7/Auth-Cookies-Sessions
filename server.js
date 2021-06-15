const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const MongoDBSession = require("connect-mongodb-session")(session);
const app = express();

const User = require("./models/User");

const MONGO_URI = "mongodb://localhost:27017/sessions";

mongoose
	.connect(MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	})
	.then((res) => {
		console.log("Db connected");
	});

const store = new MongoDBSession({
	uri: MONGO_URI,
	collection: "mySessions ",
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(
	session({
		secret: " secret key",
		resave: false,
		saveUninitialized: false,
		store: store,
	})
);
const isAuth = (req, res, next) => {
	if (req.session.isAuth) {
		next();
	} else {
		res.redirect("/login");
	}
};

app.get("/", (req, res) => {
	res.render("landing");
});

// Login Page
app.get("/login", (req, res) => {
	res.render("login");
});
app.post("/login", async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email });
	if (!user) {
		return res.redirect("/login");
	}
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		return res.redirect("/login");
	}
	req.session.isAuth = true;
	res.redirect("/dashboard");
});

// Register Page
app.post("/register", async (req, res) => {
	const { username, email, password } = req.body;
	let user = await User.findOne({ email });
	if (user) {
		return res.redirect("/register");
	}
	const hashedPass = await bcrypt.hash(password, 12);
	user = new User({
		username,
		email,
		password: hashedPass,
	});

	await user.save();
	res.redirect("/login");
});
app.get("/register", (req, res) => {
	res.render("register");
});

// Dashboard Page
app.get("/dashboard", isAuth, (req, res) => {
	res.render("dashboard");
});

app.post("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) throw err;
		res.redirect("/");
	});
});

app.listen(5000, console.log("server started"));
