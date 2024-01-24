const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let Schema = mongoose.Schema;

let userSchema = new Schema({
    userName: {
        type:String,
        unique: true
    },
    password: String,
    email: String,
    loginHistory:[
        {
            dateTime: Date,
            userAgent: String
        }
    ]
});

let User;

function initialize() {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err) => {
            reject(err);
        });

        db.once('open', () => {
            User = db.model("user", userSchema);
            resolve();
        });
    });
}

function registerUser(userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        }
        bcrypt.hash(userData.password, 10).then(hash => {
            userData.password = hash;
            let newUser = new User(userData);
            
            newUser.save()
            .then(() => {
                resolve();
            })
            .catch(err => {
                if (err.code === 11000) {
                    reject("User Name already taken");
                } else {
                    reject(`error creating the user: ${err}`);
                }
            });
        }).catch(err => {
            reject("There was an error encrypting thepassword");
        })
    });
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.find({ userName: userData.userName })
        .then(users => {
            if (users.length === 0) {
                reject(`Unable to find user: ${userData.userName}`);
            } else {
                const user = users[0]; 
                bcrypt.compare(userData.password, user.password)
                .then(match => {
                    if (!match) {
                        reject(`Incorrect Password for user: ${userData.userName}`);
                    } else {
                        if (user.loginHistory.length === 8) {
                            user.loginHistory.pop();
                        }
                        user.loginHistory.unshift({
                            dateTime: new Date(),
                            userAgent: userData.userAgent
                        });

                        User.updateOne({ userName: user.userName }, { $set: { loginHistory: user.loginHistory } })
                        .then(() => resolve(user))
                        .catch(err => {
                            reject(`Error updating the user login history: ${err}`);
                        });
                    }
                })
                .catch(err => {
                    reject(`Error during password comparison: ${err}`);
                });
            }
        }).catch(err => {
            reject(`Unable to find user: ${userData.userName}`);
        });
    });
}

module.exports = {initialize, registerUser, checkUser};