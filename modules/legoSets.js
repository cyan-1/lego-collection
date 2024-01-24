require("dotenv").config();
const Sequelize = require("sequelize");

let sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: "postgres",
        port: 5432,
        dialectOptions: {
        ssl: { rejectUnauthorized: false },
        },
    }
);

const Theme = sequelize.define(
    "Theme",
    {
        id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        },
        name: Sequelize.STRING,
    },
    {
        createdAt: false,
        updatedAt: false,
    }
);
const Set = sequelize.define( "Set",
    {
        set_num: {
            type: Sequelize.STRING,
            primaryKey: true,
        },
        name: Sequelize.STRING,
        year: Sequelize.INTEGER,
        num_parts: Sequelize.INTEGER,
        theme_id: Sequelize.INTEGER,
        img_url: Sequelize.STRING,
    },
    {
        createdAt: false,
        updatedAt: false,
    }
);

Set.belongsTo(Theme, { foreignKey: "theme_id" });

function initialize() {
    return new Promise(async (resolve, reject) => {
        try {
            await sequelize.sync();
            resolve();
        } catch (err) {
            reject(err.errors ? err.errors[0].message : err.message);
        }
    });
}

function getAllSets() {
    return new Promise(async (resolve, reject) => {
        try {
            let setData = await Set.findAll({
                include: [Theme]
            });

            resolve(setData);
        } catch(err) {
            reject(err.errors ? err.errors[0].message : err.message);
        }
    });
}

function getSetByNum(setNum) {
    return new Promise(async (resolve, reject) => {
        try {
            let setData = await Set.findAll({
                include: [Theme],
                where:{
                    set_num: setNum
                }
            });
            resolve(setData[0]);
        } catch(err) {
            reject(err.errors ? err.errors[0].message : err.message);;
        }
    });
}

function getSetsByTheme(theme) {
    return new Promise(async (resolve, reject) => {
        try {
            let setData = await Set.findAll({
                include: [Theme],
                where: {'$Theme.name$': {[Sequelize.Op.iLike]: `%${theme}%`}}
            });
            if(setData.length != 0) {
                resolve(setData);
            } else {
                throw "no sets found"
            }
        } catch(err) {
            reject(err.errors ? err.errors[0].message : err.message);
        }
    });
}

function getAllThemes() {
    return new Promise(async (resolve, reject) => {
        try {
            let themeData = await Theme.findAll();
            resolve(themeData)
        } catch(err) {
            reject(err.errors ? err.errors[0].message : err.message);
        }
    });
}

function addSet(setData) {
    return new Promise( async (resolve, reject) => {
        try {
            let newSet = await Set.create(setData);
            resolve(newSet);
        } catch(err) {
            reject(err.errors ? err.errors[0].message : err.message);
        }
    });
}

function editSet(setNum, setData) {
    return new Promise(async (resolve, reject) => {
        try {
            await Set.update(setData, {
                where: {
                    set_num: setNum
                }
            });
            resolve();
        } catch(err) {
            reject(err.errors ? err.errors[0].message : err.message);
        }
    });
}

function deleteSet(setNum) {
    return new Promise(async (resolve, reject) => {
        try{
            await Set.destroy({
                where:{
                    set_num: setNum
                }
            });
            resolve();
        } catch(err) {
            reject(err.errors ? err.errors[0].message : err.message);
        }
    });
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, getAllThemes, addSet, editSet, deleteSet};